from datetime import datetime, timezone
import re
from typing import TypedDict, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx

from app.database.models.post import GuestPost, PostStatus
from app.database.models.profile import HostProfile
from app.database.models.user import User, UserType
from app.database.session import get_db
from app.features.auth.router import get_current_user
from app.core.config import settings
from langgraph.graph import StateGraph, START, END

router = APIRouter(prefix="/panic-button", tags=["Emergency Response"])

# -----------------
# LangGraph Definitions for Panic Agent
# -----------------

class PanicState(TypedDict):
    guest_profile: Dict[str, Any]
    hosts: List[Dict[str, Any]]
    ranked_hosts: List[Dict[str, Any]]
    raw_response: str

PANIC_SYSTEM_PROMPT = """
You are an emergency coordinator for the 'Hosting for Shabbat' platform.
Your task is to rank the available Shabbat host options for a guest in distress.
You should analyze the guest's background (e.g., soldier status, dietary preferences, descriptions)
and compare them against the host options (location, kashrut level, religious orientation, etc.) to determine the best match.
"""

PANIC_USER_TEMPLATE = """
Guest Info:
- Is Soldier/National Service: {guest_is_soldier}
- Food Preferences/Allergies: {guest_food}
- Background details: {guest_notes}

Available Shabbat Hosts to rank:
{hosts_list_str}

Please output the IDs of the hosts in order of recommendation, from best to worst.
Format the output EXACTLY as a comma-separated list of IDs, like this:
id_1, id_2, id_3
Output nothing else. Only the UUIDs separated by commas.
"""

def query_hf_panic_llm(system_prompt: str, user_prompt: str) -> str:
    """Query Hugging Face Inference API for panic coordinator LLM."""
    if not settings.HF_ACCESS_TOKEN or not settings.HF_MODEL:
        return ""
    try:
        prompt = (
            f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
            f"{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n"
            f"{user_prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
        )
        response = httpx.post(
            f"https://api-inference.huggingface.co/models/{settings.HF_MODEL}",
            headers={"Authorization": f"Bearer {settings.HF_ACCESS_TOKEN}"},
            json={
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 256,
                    "temperature": 0.1,
                }
            },
            timeout=10.0,
        )
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and data and "generated_text" in data[0]:
                gen_text = data[0]["generated_text"]
                if gen_text.startswith(prompt):
                    return gen_text[len(prompt):].strip()
                return gen_text.strip()
            elif isinstance(data, dict) and "generated_text" in data:
                return data["generated_text"].strip()
        else:
            print(f"[Panic Agent LLM] status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Panic Agent LLM] error: {e}")
    return ""

def rank_hosts_node(state: PanicState) -> dict:
    """Node 1: Rank hosts based on guest profile details using Hugging Face LLM or heuristics."""
    guest = state["guest_profile"]
    hosts = state["hosts"]
    
    if not hosts:
        return {"ranked_hosts": []}
        
    hosts_list = []
    for h in hosts:
        hosts_list.append(
            f"- ID: {h['host_profile_id']}\n"
            f"  City: {h['city']}\n"
            f"  Neighborhood: {h['neighborhood']}\n"
            f"  Kashrut: {h['kashrut_level']}\n"
            f"  Religious Orientation: {h['religious_orientation']}"
        )
    hosts_list_str = "\n".join(hosts_list)
    
    user_prompt = PANIC_USER_TEMPLATE.format(
        guest_is_soldier=guest.get("is_soldier_or_national_service", False),
        guest_food=guest.get("food_preferences_allergies") or "None",
        guest_notes=guest.get("skills_give_take") or "None",
        hosts_list_str=hosts_list_str
    )
    
    raw = query_hf_panic_llm(PANIC_SYSTEM_PROMPT, user_prompt)
    
    if raw:
        parsed_ids = re.findall(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', raw.lower())
        if parsed_ids:
            id_to_host = {h["host_profile_id"]: h for h in hosts}
            ranked = []
            for pid in parsed_ids:
                if pid in id_to_host:
                    ranked.append(id_to_host[pid])
            missed = [h for h in hosts if h["host_profile_id"] not in parsed_ids]
            return {"ranked_hosts": ranked + missed}
            
    # Fallback: Heuristic sorting (Proximity + Kashrut)
    def heuristic_key(h):
        # Prefer matching city
        city_match = 0 if str(h["city"]).strip().lower() == str(guest.get("origin_city") or "").strip().lower() else 1
        kashrut_order = {"glatt_mehadrin": 0, "kosher": 1, "basic": 2, "none": 3}
        k_score = kashrut_order.get(str(h["kashrut_level"]).lower(), 4)
        return (city_match, k_score)
        
    sorted_hosts = sorted(hosts, key=heuristic_key)
    return {"ranked_hosts": sorted_hosts}

# Setup LangGraph workflow for panic agent
panic_workflow = StateGraph(PanicState)
panic_workflow.add_node("rank", rank_hosts_node)
panic_workflow.add_edge(START, "rank")
panic_workflow.add_edge("rank", END)
panic_agent = panic_workflow.compile()


@router.post("/activate")
def activate_panic_button(
    force_time_check: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.user_type != UserType.GUEST or not current_user.guest_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guests can activate the emergency panic button",
        )

    # Block if guest already has an active match
    if db.query(GuestPost).filter(
        GuestPost.guest_profile_id == current_user.guest_profile.id,
        GuestPost.status == PostStatus.MATCHED,
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active matched Shabbat booking",
        )

    now = datetime.now(timezone.utc)
    # Panic button active from Thursday 16:00 (weekday 3 = Thursday)
    is_active_window = now.weekday() > 3 or (now.weekday() == 3 and now.hour >= 16)

    if force_time_check and not is_active_window:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The emergency panic button is only active from Thursday at 16:00",
        )

    emergency_hosts = db.query(HostProfile).filter(
        HostProfile.emergency_available.is_(True)
    ).all()

    # Prep host structures
    hosts_to_rank = [
        {
            "host_profile_id": str(h.id),
            "city": h.city,
            "neighborhood": h.neighborhood,
            "kashrut_level": h.kashrut_level.value if hasattr(h.kashrut_level, "value") else str(h.kashrut_level),
            "religious_orientation": h.religious_orientation,
            "host_name": h.user.full_name if h.user else "Anonymous Host",
            "phone_number": h.user.phone_number if h.user else "Hidden",
        }
        for h in emergency_hosts
    ]

    # Guest profile details
    guest_profile_data = {
        "is_soldier_or_national_service": current_user.guest_profile.is_soldier_or_national_service,
        "food_preferences_allergies": current_user.guest_profile.food_preferences_allergies,
        "skills_give_take": current_user.guest_profile.skills_give_take,
        "origin_city": current_user.guest_profile.origin_city,
    }

    # Run LangGraph Panic Agent
    try:
        state_input = {
            "guest_profile": guest_profile_data,
            "hosts": hosts_to_rank,
            "ranked_hosts": [],
            "raw_response": ""
        }
        agent_result = panic_agent.invoke(state_input)
        ranked_hosts = agent_result.get("ranked_hosts") or hosts_to_rank
    except Exception as e:
        print(f"[Panic Button API] LangGraph failed: {e}")
        ranked_hosts = hosts_to_rank

    return {
        "message": "Emergency panic button activated successfully",
        "timestamp": now,
        "emergency_hosts": ranked_hosts,
    }
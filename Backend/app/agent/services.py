import hashlib
import os
import re
from typing import TypedDict, List
import httpx

from app.core.config import settings
from app.agent.prompts import ICEBREAKER_SYSTEM_PROMPT, ICEBREAKER_USER_TEMPLATE
from langgraph.graph import StateGraph, START, END

# Initialize LangSmith environment variables if configured
if settings.LANGCHAIN_TRACING_V2 and settings.LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT

def _normalize(vector: list[float]) -> list[float]:
    """Normalize a vector to unit length in-place (L2 norm)."""
    magnitude = sum(x * x for x in vector) ** 0.5
    return [x / magnitude for x in vector] if magnitude > 0 else vector

def _pad_or_truncate(vector: list[float], size: int = 1536) -> list[float]:
    """Ensure vector is exactly `size` dimensions."""
    if len(vector) > size:
        return vector[:size]
    if len(vector) < size:
        return vector + [0.0] * (size - len(vector))
    return vector

# LangGraph Definitions for Icebreaker Agent
class IcebreakerState(TypedDict):
    host_city: str
    host_kashrut: str
    host_religious: str
    host_atmosphere: str
    guest_status: str
    guest_dietary: str
    guest_preference: str
    raw_response: str
    icebreakers: List[str]

def query_hf_llm(system_prompt: str, user_prompt: str) -> str:
    """Query Hugging Face Inference API for chat completion."""
    if not settings.HF_ACCESS_TOKEN or not settings.HF_MODEL:
        return ""
    try:
        # Prompt structure for Llama 3 Instruct
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
                    "max_new_tokens": 512,
                    "temperature": 0.7,
                }
            },
            timeout=15.0,
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
            print(f"[HF LLM] status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[HF LLM] error: {e}")
    return ""

def generate_node(state: IcebreakerState) -> dict:
    """Node 1: Generate Raw Icebreaker Suggestions from HF LLM."""
    user_prompt = ICEBREAKER_USER_TEMPLATE.format(
        host_city=state.get("host_city") or "Unknown",
        host_kashrut=state.get("host_kashrut") or "Unknown",
        host_religious=state.get("host_religious") or "Unknown",
        host_atmosphere=state.get("host_atmosphere") or "Unknown",
        guest_status=state.get("guest_status") or "Regular Guest",
        guest_dietary=state.get("guest_dietary") or "None",
        guest_preference=state.get("guest_preference") or "None"
    )
    
    raw = query_hf_llm(ICEBREAKER_SYSTEM_PROMPT, user_prompt)
    return {"raw_response": raw}

def parse_and_validate_node(state: IcebreakerState) -> dict:
    """Node 2: Parse raw LLM output and filter/verify list of questions."""
    raw = state.get("raw_response", "")
    default_icebreakers = [
        "What is your favorite Shabbat custom?",
        "Do you have any dietary preferences or restrictions?",
        "Are there any specific Shabbat rules you observe that we should coordinate?",
    ]
    
    if not raw:
        return {"icebreakers": default_icebreakers}
        
    lines = raw.split("\n")
    questions = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Remove markdown lists, numeric lists like 1. 2. or bullet points
        clean = re.sub(r"^(\d+[\.\)]|\*|-)\s*", "", line).strip()
        if len(clean) > 8 and (clean.endswith("?") or "?" in clean):
            questions.append(clean)
            
    # Fallback if parsing didn't find enough valid questions
    if len(questions) < 2:
        return {"icebreakers": default_icebreakers}
        
    return {"icebreakers": questions[:3]}

# Build the LangGraph workflow
workflow = StateGraph(IcebreakerState)
workflow.add_node("generate", generate_node)
workflow.add_node("parse_validate", parse_and_validate_node)

workflow.add_edge(START, "generate")
workflow.add_edge("generate", "parse_validate")
workflow.add_edge("parse_validate", END)

icebreaker_agent = workflow.compile()

class AgentService:
    """Handles vector embedding generation and LLM icebreaker questions."""

    @staticmethod
    def generate_embedding(text: str) -> list[float]:
        """
        Generate a 1536-dim normalized embedding for `text`.
        Priority: Hugging Face → deterministic hash fallback.
        """
        if not text:
            return [0.0] * 1536

        # 1. Hugging Face Inference API
        if settings.HF_ACCESS_TOKEN and settings.HF_MODEL:
            try:
                response = httpx.post(
                    f"https://api-inference.huggingface.co/models/{settings.HF_MODEL}",
                    headers={"Authorization": f"Bearer {settings.HF_ACCESS_TOKEN}"},
                    json={"inputs": text},
                    timeout=10.0,
                )
                if response.status_code == 200:
                    data = response.json()
                    # Unwrap nested list structure returned by some HF models
                    while isinstance(data, list) and data and isinstance(data[0], list):
                        data = data[0]
                    if isinstance(data, list) and all(isinstance(x, (int, float)) for x in data):
                        return _normalize(_pad_or_truncate(list(data)))
                else:
                    print(f"[HF] status {response.status_code}: {response.text}")
            except Exception as e:
                print(f"[HF] error: {e}. Falling back to hash embedding.")

        # 2. Deterministic hash-based fallback (no external calls)
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        vector = [((digest[i % 32] + i * 17) % 256 / 127.5) - 1.0 for i in range(1536)]
        return _normalize(vector)

    @staticmethod
    def generate_icebreakers(host_attributes: dict, guest_attributes: dict) -> list[str]:
        """Return 3 personalized icebreaker questions for a host-guest pair using LangGraph."""
        input_state = {
            "host_city": host_attributes.get("city") or "Unknown",
            "host_kashrut": str(host_attributes.get("kashrut_level") or "Unknown"),
            "host_religious": host_attributes.get("religious_orientation") or "Unknown",
            "host_atmosphere": host_attributes.get("atmosphere") or "Unknown",
            "guest_status": "Soldier/National Service" if guest_attributes.get("is_soldier") else "Regular Guest",
            "guest_dietary": guest_attributes.get("food_preferences_allergies") or "None",
            "guest_preference": guest_attributes.get("description") or "None",
            "raw_response": "",
            "icebreakers": []
        }
        
        try:
            result = icebreaker_agent.invoke(input_state)
            return result.get("icebreakers") or []
        except Exception as e:
            print(f"[AgentService] error running LangGraph: {e}")
            # Failsafe fallback
            return [
                "What is your favorite Shabbat custom?",
                "Do you have any dietary preferences or restrictions?",
                "Are there any specific Shabbat rules you observe that we should coordinate?",
            ]

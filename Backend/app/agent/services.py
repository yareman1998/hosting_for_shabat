import hashlib
from app.core.config import settings

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
                import httpx
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

        # 3. Deterministic hash-based fallback (no external calls)
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        vector = [((digest[i % 32] + i * 17) % 256 / 127.5) - 1.0 for i in range(1536)]
        return _normalize(vector)

    @staticmethod
    def generate_icebreakers(host_attributes: dict, guest_attributes: dict) -> list[str]:
        """Return 3 personalized icebreaker questions for a host-guest pair."""
        # Static MVP placeholders — replace with LLM call when available
        return [
            "What is your favorite Shabbat custom?",
            "Do you have any dietary preferences or restrictions?",
            "Are there any specific Shabbat rules you observe that we should coordinate?",
        ]


import requests
import uuid

API_URL = "http://127.0.0.1:8000/api"

def test_rag_hallucination():
    print("\n--- Testing Hallucination Control ---")
    conv_id = str(uuid.uuid4())
    
    # We assume no bot is trained on "Extraterrestrial life in the 1800s"
    # Find a bot ID first
    bots = requests.get(f"{API_URL}/chatbots").json()
    if not bots:
        print("No bots found. Please create one first.")
        return
    
    bot_id = bots[0]['id']
    print(f"Using Bot ID: {bot_id}")

    # Out of context question
    payload = {
        "message": "What did George Washington think about Bitcoin?",
        "conversation_id": conv_id
    }
    res = requests.post(f"{API_URL}/chatbots/{bot_id}/chat", json=payload).json()
    print(f"Q: {payload['message']}")
    print(f"A: {res['response']}")
    
    if "haven't been trained" in res['response'] or "don't know" in res['response'].lower():
        print("✅ SUCCESS: Bot refused out-of-context question.")
    else:
        print("❌ FAILURE: Bot hallucinated or answered using general knowledge.")

def test_history_pronouns():
    print("\n--- Testing History-Aware Retrieval (Pronouns) ---")
    conv_id = str(uuid.uuid4())
    bots = requests.get(f"{API_URL}/chatbots").json()
    bot_id = bots[0]['id']

    # Q1: Establish context
    q1 = "What is Palmonas?"
    requests.post(f"{API_URL}/chatbots/{bot_id}/chat", json={"message": q1, "conversation_id": conv_id})
    print(f"Sent Q1: {q1}")

    # Q2: Ambiguous pronoun
    q2 = "What are its main products?"
    res = requests.post(f"{API_URL}/chatbots/{bot_id}/chat", json={"message": q2, "conversation_id": conv_id}).json()
    print(f"Q2 (Ambiguous): {q2}")
    print(f"A2: {res['response']}")

    # If the response mentions "jewelry" or "Palmonas", the history re-writing worked
    if "jewelry" in res['response'].lower() or "palmonas" in res['response'].lower() or "rings" in res['response'].lower():
        print("✅ SUCCESS: History-aware retrieval worked.")
    else:
        print("❌ FAILURE: Bot failed to resolve 'its' in query or context missing.")

if __name__ == "__main__":
    test_rag_hallucination()
    test_history_pronouns()

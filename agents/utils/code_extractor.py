# agents/utils/code_extractor.py
import re

def extract_code_block(text: str, language: str = "python") -> str:
    """Strips LLM conversational filler and extracts raw code from markdown blocks."""
    if not text:
        return ""
    
    # Try exact language match
    pattern = rf"```{language}\s*(.*?)\s*```"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Fallback: try generic code block
    generic_match = re.search(r"```\w*\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if generic_match:
        return generic_match.group(1).strip()
        
    # Last resort: return raw text stripped
    return text.strip()

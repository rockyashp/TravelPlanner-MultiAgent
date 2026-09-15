"""
Intent Parser Proxy — exports intent_agent_node.
"""
from app.agents.intent_agent import intent_agent_node

# Backward-compatibility alias
intent_parser_node = intent_agent_node

__all__ = ["intent_agent_node", "intent_parser_node"]

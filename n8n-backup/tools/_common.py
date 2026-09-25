# Helper used to generate the n8n backup JSON files (import format: Workflows > Import from File).
import json, os
OUT = os.path.join(os.path.dirname(__file__), '..')

def cred(kind, label):
    # Credentials are NOT exported. Only a placeholder name is kept; re-select the credential after import.
    return {kind: {"id": "", "name": f"REPLACE_ME - {label}"}}

def save(filename, name, nodes, connections, description="", source_id=""):
    wf = {
        "name": name,
        "nodes": nodes,
        "connections": connections,
        "settings": {"executionOrder": "v1", "availableInMCP": True},
        "meta": {"backupNote": f"Backed up 2026-09-25 from n8n cloud workflow id {source_id}. Credentials stripped.", "description": description},
        "active": False,
        "pinData": {},
    }
    with open(os.path.join(OUT, filename), "w") as f:
        json.dump(wf, f, indent=2, ensure_ascii=False)
    print("wrote", filename)

def main_conn(pairs):
    c = {}
    for src, dst in pairs:
        c.setdefault(src, {"main": [[]]})["main"][0].append({"node": dst, "type": "main", "index": 0})
    return c

def exec_trigger(name, inputs, pos=(0, 0)):
    return {"id": name.lower().replace(' ', '-'), "name": name, "type": "n8n-nodes-base.executeWorkflowTrigger", "typeVersion": 1.2, "position": list(pos),
            "parameters": {"inputSource": "workflowInputs", "workflowInputs": {"values": [{"name": i, "type": "string"} for i in inputs]}}}

def data_table_get(name, table_id, key_name, trigger, key_field, pos, condition="eq"):
    cond = {"keyName": key_name, "condition": condition}
    if condition == "eq":
        cond["keyValue"] = "={{ $('%s').item.json.%s }}" % (trigger, key_field)
    return {"id": name.lower().replace(' ', '-'), "name": name, "type": "n8n-nodes-base.dataTable", "typeVersion": 1.1, "position": list(pos),
            "parameters": {"resource": "row", "operation": "get", "dataTableId": {"__rl": True, "mode": "id", "value": table_id},
                           "matchType": "allConditions", "filters": {"conditions": [cond]}, "returnAll": True},
            "executeOnce": True, "alwaysOutputData": True}

def code(name, js, pos, mode="runOnceForAllItems"):
    return {"id": name.lower().replace(' ', '-'), "name": name, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": list(pos),
            "parameters": {"mode": mode, "language": "javaScript", "jsCode": js}}

def mcp_wrapper(filename, name, path, instructions, tool_name, tool_desc, engine_id, inputs, webhook_id, description, source_id):
    value = {k: "={{ $fromAI('%s', %s, 'string') }}" % (k, json.dumps(d)) for k, d in inputs}
    nodes = [
        {"id": "mcp-trigger", "name": name.replace("OnboardAI - ", "OnboardAI "), "type": "@n8n/n8n-nodes-langchain.mcpTrigger", "typeVersion": 2.1,
         "position": [0, 112], "parameters": {"path": path, "authentication": "none", "instructions": instructions}, "webhookId": webhook_id},
        {"id": "tool", "name": tool_name, "type": "@n8n/n8n-nodes-langchain.toolWorkflow", "typeVersion": 2.2, "position": [80, 336],
         "parameters": {"description": tool_desc, "source": "database",
                        "workflowId": {"__rl": True, "mode": "id", "value": engine_id, "__comment": "REMAP to the new id of the imported Engine (Logic) workflow"},
                        "workflowInputs": {"mappingMode": "defineBelow", "value": value, "matchingColumns": [],
                                           "schema": [{"id": k, "displayName": k, "required": False, "defaultMatch": False, "display": True, "canBeUsedToMatch": True, "type": "string"} for k, _ in inputs],
                                           "attemptToConvertTypes": False, "convertFieldsToString": False}}},
    ]
    conns = {tool_name: {"ai_tool": [[{"node": nodes[0]["name"], "type": "ai_tool", "index": 0}]]}}
    save(filename, name, nodes, conns, description, source_id)

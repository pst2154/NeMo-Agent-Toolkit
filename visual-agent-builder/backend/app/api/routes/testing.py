"""Testing API routes."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import tempfile
import yaml
import os
import time
import asyncio
import subprocess
import re

router = APIRouter()


def clean_ansi_codes(text: str) -> str:
    """Remove ANSI color codes from text."""
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)


def parse_agent_steps(output: str) -> list:
    """Parse agent execution steps from NAT output.
    
    Args:
        output: Raw NAT output
        
    Returns:
        List of execution steps with details
    """
    steps = []
    lines = output.split('\n')
    
    step_number = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Extract timestamp from line
        timestamp_match = re.match(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
        timestamp = timestamp_match.group(1) if timestamp_match else None
        
        # Look for agent input
        if 'Agent input:' in line:
            step_number += 1
            input_text = line.split('Agent input:')[-1].strip()
            
            # Look ahead for thoughts
            thought_text = ""
            action_text = ""
            action_input = ""
            observation = ""
            
            j = i + 1
            while j < len(lines):
                next_line = lines[j]
                
                if "Agent's thoughts:" in next_line:
                    # Capture everything until next separator
                    k = j + 1
                    thought_lines = []
                    while k < len(lines) and not lines[k].startswith('----') and 'Calling tools:' not in lines[k]:
                        thought_lines.append(lines[k])
                        k += 1
                    thought_text = '\n'.join(thought_lines).strip()
                    j = k - 1
                    
                elif 'Calling tools:' in next_line:
                    action_text = next_line.split('Calling tools:')[-1].strip()
                    
                elif "Tool's input:" in next_line:
                    action_input = next_line.split("Tool's input:")[-1].strip()
                    
                elif "Tool's response:" in next_line:
                    # Capture everything until next separator
                    k = j + 1
                    obs_lines = []
                    while k < len(lines) and not lines[k].startswith('----') and 'Agent input:' not in lines[k]:
                        obs_lines.append(lines[k])
                        k += 1
                    observation = '\n'.join(obs_lines).strip()
                    j = k - 1
                    break
                    
                j += 1
            
            # Create step entry
            step = {
                'step': step_number,
                'type': 'reasoning',
                'content': input_text,
                'timestamp': timestamp
            }
            
            if thought_text:
                step['thought'] = thought_text
            if action_text:
                step['action'] = action_text
            if action_input:
                step['action_input'] = action_input
            if observation:
                step['observation'] = observation
                
            steps.append(step)
            i = j
            
        elif 'Workflow Result:' in line:
            # Extract final answer
            result_lines = []
            k = i + 1
            while k < len(lines) and not lines[k].startswith('--'):
                if lines[k].strip():
                    result_lines.append(lines[k])
                k += 1
            
            steps.append({
                'step': step_number + 1,
                'type': 'final_answer',
                'content': '\n'.join(result_lines).strip(),
                'timestamp': timestamp
            })
            break
            
        i += 1
    
    return steps


async def execute_nat_workflow(yaml_content: str, input_message: str) -> Dict[str, Any]:
    """Execute a NAT workflow with the given input.
    
    Args:
        yaml_content: YAML workflow configuration
        input_message: User input message
        
    Returns:
        Execution result
    """
    start_time = time.time()
    
    try:
        # Create temporary file for workflow
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            f.write(yaml_content)
            temp_file = f.name
        
        try:
            # Try NAT CLI first - capture all output
            process = await asyncio.create_subprocess_exec(
                'nat', 'run', 
                '--config_file', temp_file,
                '--input', input_message,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            execution_time = time.time() - start_time
            
            # Combine stdout and stderr for full output
            output = stdout.decode('utf-8').strip()
            error_output = stderr.decode('utf-8').strip()
            
            # Clean ANSI color codes
            output = clean_ansi_codes(output)
            error_output = clean_ansi_codes(error_output)
            
            full_output = f"{output}\n{error_output}" if error_output else output
            
            if process.returncode == 0:
                
                # Parse agent steps from output
                steps = parse_agent_steps(full_output)
                
                # Extract final answer
                final_answer = ""
                if 'Workflow Result:' in full_output:
                    result_idx = full_output.find('Workflow Result:')
                    result_section = full_output[result_idx:].split('\n')[1:5]  # Get a few lines after
                    final_answer = '\n'.join([line.strip() for line in result_section if line.strip() and not line.startswith('--')])
                
                return {
                    "success": True,
                    "output": final_answer if final_answer else full_output,
                    "execution_time": execution_time,
                    "intermediate_steps": steps,
                    "error": None,
                    "raw_output": full_output,  # Include raw output for debugging
                    "stderr": error_output  # Include stderr separately
                }
            else:
                error_msg = stderr.decode('utf-8').strip()
                return {
                    "success": False,
                    "output": None,
                    "execution_time": execution_time,
                    "error": error_msg or "Workflow execution failed",
                    "intermediate_steps": []
                }
        except FileNotFoundError:
            # NAT CLI not found, try Python module approach
            try:
                # Try using Python directly with nat module
                process = await asyncio.create_subprocess_exec(
                    'python', '-m', 'nat.cli', 'run', '--config_file', temp_file, '--input', input_message,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                execution_time = time.time() - start_time
                
                if process.returncode == 0:
                    output = stdout.decode('utf-8').strip()
                    
                    # Parse the output to extract the actual agent response
                    lines = output.split('\n')
                    response_started = False
                    response_lines = []
                    
                    for line in lines:
                        if 'Configuration Summary:' in line:
                            continue
                        elif line.startswith('----'):
                            continue
                        elif 'Workflow Type:' in line or 'Number of' in line:
                            continue
                        elif line.strip() == '':
                            if response_started:
                                response_lines.append(line)
                        else:
                            response_started = True
                            response_lines.append(line)
                    
                    parsed_output = '\n'.join(response_lines).strip() if response_lines else output
                    
                    if not parsed_output or parsed_output == output:
                        if 'Configuration Summary:' in output and len(lines) > 15:
                            parsed_output = "Agent executed but no response text was captured. Check logs for details."
                    
                    return {
                        "success": True,
                        "output": parsed_output if parsed_output else output,
                        "execution_time": execution_time,
                        "intermediate_steps": [],
                        "error": None,
                        "raw_output": output
                    }
                else:
                    error_msg = stderr.decode('utf-8').strip()
                    return {
                        "success": False,
                        "output": None,
                        "execution_time": execution_time,
                        "error": error_msg or "Workflow execution failed",
                        "intermediate_steps": []
                    }
            except Exception as e:
                return {
                    "success": False,
                    "output": None,
                    "execution_time": time.time() - start_time,
                    "error": f"NAT not installed. Install with: pip install nvidia-nat\nError: {str(e)}",
                    "intermediate_steps": []
                }
        finally:
            # Clean up temp file
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "execution_time": time.time() - start_time,
            "error": f"Execution error: {str(e)}",
            "intermediate_steps": []
        }


@router.post("/{workflow_id}")
async def test_workflow(
    workflow_id: str,
    test_input: Dict[str, Any]
) -> Dict[str, Any]:
    """Test a workflow with given input.
    
    Args:
        workflow_id: ID of the workflow to test
        test_input: Test input data containing 'message' and 'workflow' YAML
        
    Returns:
        Test result with output and execution details
    """
    input_message = test_input.get("message", "")
    workflow_yaml = test_input.get("workflow_yaml", None)
    
    if not input_message:
        raise HTTPException(status_code=400, detail="Input message is required")
    
    if not workflow_yaml:
        # If no workflow YAML provided, return error asking for it
        raise HTTPException(
            status_code=400, 
            detail="Workflow YAML is required. Please save your workflow first."
        )
    
    # Execute the workflow
    result = await execute_nat_workflow(workflow_yaml, input_message)
    
    return result


@router.get("/{workflow_id}/status")
async def get_workflow_status(workflow_id: str) -> Dict[str, Any]:
    """Get the current status of a workflow.
    
    Args:
        workflow_id: ID of the workflow
        
    Returns:
        Status information
    """
    return {
        "workflow_id": workflow_id,
        "status": "ready",
        "last_run": "2025-01-15T10:30:00Z",
        "total_runs": 42,
        "success_rate": 0.95
    }

import json
import sys

def format_conversations_json(input_file, output_file=None):
    """
    Format a ChatGPT conversations.json file to make it more readable.
    
    Args:
        input_file (str): Path to the input conversations.json file
        output_file (str): Path to the output formatted file (optional)
    """
    try:
        # Read the single-line JSON file
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # If no output file specified, create one with '_formatted' suffix
        if output_file is None:
            name_parts = input_file.rsplit('.', 1)
            output_file = f"{name_parts[0]}_formatted.{name_parts[1]}"
        
        # Write the formatted JSON with proper indentation
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully formatted {input_file}")
        print(f"�� Output saved to: {output_file}")
        
        # Print some basic stats
        if isinstance(data, list):
            print(f"📊 Found {len(data)} conversations")
        elif isinstance(data, dict):
            print(f"📊 Found {len(data)} top-level keys")
            
    except FileNotFoundError:
        print(f"❌ Error: File '{input_file}' not found")
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON format - {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python format_conversations.py <input_file> [output_file]")
        print("Example: python format_conversations.py conversations.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    format_conversations_json(input_file, output_file)
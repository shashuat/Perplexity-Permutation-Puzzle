# python_perplexity_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn.functional as F
from transformers import AutoModelForCausalLM, AutoTokenizer
import math
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define model path - change this to your local Gemma 2 model path
MODEL_PATH = os.environ.get('MODEL_PATH', '/path/to/gemma-2-9b/2')
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# Initialize tokenizer and model (lazy loading)
tokenizer = None
model = None

def load_model():
    """Lazy load the model and tokenizer when first needed"""
    global tokenizer, model
    
    if tokenizer is None or model is None:
        print(f"Loading model from {MODEL_PATH} on {DEVICE}...")
        
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            torch_dtype=torch.float16 if DEVICE == 'cuda' else torch.float32,
            device_map='auto'
        )
        model.eval()
        
        print("Model loaded successfully!")

def calculate_perplexity(text):
    """Calculate perplexity score for a given text"""
    load_model()  # Ensure model is loaded
    
    with torch.no_grad():
        # Add sequence boundary tokens
        text_with_special = f"{tokenizer.bos_token}{text}{tokenizer.eos_token}"
        
        # Tokenize
        model_inputs = tokenizer(
            text_with_special,
            return_tensors='pt',
            add_special_tokens=False,
        )
        
        if 'token_type_ids' in model_inputs:
            model_inputs.pop('token_type_ids')
        
        model_inputs = {k: v.to(DEVICE) for k, v in model_inputs.items()}
        
        # Get model output
        output = model(**model_inputs, use_cache=False)
        logits = output['logits']
        
        # Shift logits and labels for calculating loss
        shift_logits = logits[..., :-1, :].contiguous()
        shift_labels = model_inputs['input_ids'][..., 1:].contiguous()
        
        # Calculate token-wise loss
        loss_fct = torch.nn.CrossEntropyLoss(reduction='none')
        loss = loss_fct(
            shift_logits.view(-1, shift_logits.size(-1)),
            shift_labels.view(-1)
        )
        
        # Calculate perplexity
        sequence_loss = loss.sum() / len(loss)
        perplexity = torch.exp(sequence_loss).item()
        
        return perplexity

@app.route('/calculate-perplexity', methods=['POST'])
def perplexity_endpoint():
    data = request.json
    
    if not data or 'text' not in data:
        return jsonify({'error': 'Text is required'}), 400
    
    try:
        text = data['text']
        perplexity = calculate_perplexity(text)
        
        return jsonify({
            'perplexity': perplexity,
            'text': text
        })
    
    except Exception as e:
        print(f"Error calculating perplexity: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model at startup if you have enough memory
    # load_model()
    
    # Run the Flask server
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
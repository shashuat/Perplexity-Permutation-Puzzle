import pandas as pd
import numpy as np
import torch
import torch.nn.functional as F
from transformers import AutoModelForCausalLM, AutoTokenizer
from typing import List, Dict, Tuple, Optional, Union
import glob
import os
from tabulate import tabulate

class TextPerplexityEvaluator:
    """
    A class for evaluating text perplexity using a pre-trained language model.
    
    This evaluator loads a specified language model and calculates perplexity scores
    for text sequences, which measures how "surprising" or unlikely the text is
    according to the model. Lower perplexity indicates more natural, coherent text.
    
    Attributes:
        tokenizer: The tokenizer for the language model
        model: The pre-trained language model
        device: The device (CPU/GPU) on which to run the model
        loss_fct: The loss function for calculating perplexity
    """
    
    def __init__(self, 
                 model_path: str = '/kaggle/input/gemma-2/transformers/gemma-2-9b/2',
                 device: str = 'cuda' if torch.cuda.is_available() else 'cpu'):
        """
        Initialize the perplexity evaluator with a pre-trained language model.
        
        Args:
            model_path: Path to the pre-trained model directory
            device: Computation device ('cuda' for GPU, 'cpu' for CPU)
        """
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == 'cuda' else torch.float32,
            device_map='auto'
        )
        self.model.eval()
        self.device = device
        self.loss_fct = torch.nn.CrossEntropyLoss(reduction='none')

    def compute_text_perplexity(self, text: str) -> float:
        """
        Calculate the perplexity score for a given text.
        
        This method computes perplexity by tokenizing the input text,
        running it through the language model, and calculating the average
        per-token loss, which is then exponentiated to get the perplexity.
        
        Args:
            text: The input text to evaluate
            
        Returns:
            float: The perplexity score (lower is better)
        """
        with torch.no_grad():
            # Append special tokens to the text
            processed_text = f"{self.tokenizer.bos_token}{text}{self.tokenizer.eos_token}"
            
            # Convert text to model inputs
            inputs = self.tokenizer(
                processed_text,
                return_tensors='pt',
                add_special_tokens=False,
            )
            
            # Remove token type IDs if present (not needed for causal LM)
            if 'token_type_ids' in inputs:
                inputs.pop('token_type_ids')
            
            # Move inputs to the appropriate device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get model predictions
            model_output = self.model(**inputs, use_cache=False)
            logits = model_output['logits']
            
            # Prepare for loss calculation (shift logits and labels)
            shift_logits = logits[..., :-1, :].contiguous()
            shift_labels = inputs['input_ids'][..., 1:].contiguous()
            
            # Calculate token-wise loss
            token_losses = self.loss_fct(
                shift_logits.view(-1, shift_logits.size(-1)),
                shift_labels.view(-1)
            )
            
            # Calculate sequence-level perplexity
            avg_loss = token_losses.sum() / len(token_losses)
            perplexity = torch.exp(avg_loss).item()
            
            return perplexity


def discover_submission_files(base_dir: str = '.') -> List[Tuple[str, pd.DataFrame]]:
    """
    Recursively find and load all submission files from a directory.
    
    This function searches through the specified directory (and all subdirectories)
    for CSV files that have 'submission' in their name, loads them, and verifies
    that they have the required columns.
    
    Args:
        base_dir: The root directory to search for submission files
        
    Returns:
        List of tuples containing (file_path, dataframe) for each valid submission file
        
    Raises:
        ValueError: If no valid submission files are found
    """
    submission_paths = []
    
    # Search for submission files recursively
    for root, _, files in os.walk(base_dir):
        for filename in files:
            if filename.endswith('.csv') and 'submission' in filename.lower():
                full_path = os.path.join(root, filename)
                submission_paths.append(full_path)
    
    if not submission_paths:
        raise ValueError("No submission files were found in the specified directory!")
    
    valid_submissions = []
    print(f"\nDiscovered {len(submission_paths)} potential submission files:")
    print("-" * 60)
    
    # Load and validate each submission file
    for file_path in submission_paths:
        try:
            df = pd.read_csv(file_path)
            # Check if file has required columns
            if 'id' in df.columns and 'text' in df.columns:
                print(f"Successfully loaded: {file_path}")
                valid_submissions.append((file_path, df))
            else:
                print(f"Skipping {file_path} - Invalid format (missing required id/text columns)")
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")
    
    if not valid_submissions:
        raise ValueError("No valid submission files were found! Ensure files contain 'id' and 'text' columns.")
    
    return valid_submissions


def analyze_submission_perplexity(submissions: List[Tuple[str, pd.DataFrame]], 
                                evaluator: TextPerplexityEvaluator) -> Tuple[pd.DataFrame, Dict]:
    """
    Evaluate all submission files and track perplexity scores for each text.
    
    This function processes each submission, calculates perplexity scores for each text,
    and identifies the best-performing text for each row across all submissions.
    
    Args:
        submissions: List of tuples containing (file_path, dataframe) for each submission
        evaluator: The perplexity evaluator instance
        
    Returns:
        Tuple containing:
          - DataFrame with detailed scores for each text in each submission
          - Dictionary with summary information including best texts and sources
    """
    
    # Initialize data structures for storing scores and texts
    row_count = len(submissions[0][1])  # Use first submission for row count
    submission_count = len(submissions)
    perplexity_scores = np.zeros((row_count, submission_count))
    all_texts = [['' for _ in range(submission_count)] for _ in range(row_count)]
    
    print("\nEvaluating submissions for perplexity:")
    print("-" * 60)
    
    submission_identifiers = []
    
    # Process each submission and calculate scores
    for sub_idx, (file_path, submission_df) in enumerate(submissions):
        identifier = file_path
        submission_identifiers.append(identifier)
        current_scores = []
        
        print(f"\nProcessing submission {sub_idx + 1}/{submission_count}: {identifier}")
        
        # Calculate perplexity for each text in the submission
        for row_idx, text in enumerate(submission_df['text']):
            perplexity = evaluator.compute_text_perplexity(text)
            perplexity_scores[row_idx, sub_idx] = perplexity
            all_texts[row_idx][sub_idx] = text
            current_scores.append(perplexity)
            print(f"Row {row_idx + 1}: Perplexity = {perplexity:.2f}")
        
        avg_perplexity = np.mean(current_scores)
        print(f"Average submission perplexity: {avg_perplexity:.2f}")
    
    # Create detailed scores DataFrame
    scores_df = pd.DataFrame(perplexity_scores, columns=submission_identifiers)
    
    # Find best texts (lowest perplexity) for each row
    optimal_texts = []
    optimal_scores = []
    optimal_sources = []
    
    for row_idx in range(row_count):
        # Find submission with lowest perplexity for this row
        best_sub_idx = np.argmin(perplexity_scores[row_idx])
        optimal_texts.append(all_texts[row_idx][best_sub_idx])
        optimal_scores.append(perplexity_scores[row_idx, best_sub_idx])
        optimal_sources.append(submission_identifiers[best_sub_idx])
    
    # Compile summary information
    summary = {
        'optimal_texts': optimal_texts,
        'optimal_scores': optimal_scores,
        'optimal_sources': optimal_sources,
        'submission_identifiers': submission_identifiers,
        'perplexity_matrix': perplexity_scores
    }
    
    return scores_df, summary


def generate_ensemble_submission(base_df: pd.DataFrame, 
                               summary: Dict, 
                               output_path: str):
    """
    Create an optimized ensemble submission by selecting the best text for each row.
    
    This function generates a final submission file using the best-performing texts
    from across all evaluated submissions, and provides detailed analysis on the
    performance and contribution of each source submission.
    
    Args:
        base_df: Base DataFrame with the original submission structure
        summary: Dictionary containing best texts, scores, and source information
        output_path: Path to save the final ensemble submission file
    """
    # Create result DataFrame with best texts
    optimized_df = base_df.copy()
    optimized_df['text'] = summary['optimal_texts']
    
    # Generate detailed analysis report
    print("\nEnsemble Optimization Results:")
    print("-" * 60)
    
    # Report average perplexity for each submission
    print("\nSource Submission Averages:")
    for sub_idx, sub_name in enumerate(summary['submission_identifiers']):
        avg_score = np.mean(summary['perplexity_matrix'][:, sub_idx])
        print(f"{sub_name}: {avg_score:.2f}")
    
    # Create detailed table of selected texts
    print("\nSelected Optimal Texts:")
    table_rows = []
    for idx, (text, score, source) in enumerate(zip(
        summary['optimal_texts'], 
        summary['optimal_scores'], 
        summary['optimal_sources']
    )):
        # Truncate long texts for display
        display_text = f"{text[:50]}..." if len(text) > 50 else text
        table_rows.append([
            idx,
            display_text,
            f"{score:.2f}",
            source
        ])
    
    print(tabulate(table_rows, 
                  headers=['Row', 'Selected Text', 'Perplexity', 'Source'],
                  tablefmt='grid'))
    
    # Calculate and display final ensemble score
    ensemble_avg_score = np.mean(summary['optimal_scores'])
    print(f"\nFinal Ensemble Average Perplexity: {ensemble_avg_score:.2f}")
    
    # Analyze contribution of each source submission
    contribution_counts = pd.Series(summary['optimal_sources']).value_counts()
    print("\nSource Submission Contribution Analysis:")
    for source, count in contribution_counts.items():
        percentage = (count / len(summary['optimal_texts'])) * 100
        print(f"{source}: {count} texts ({percentage:.1f}%)")
    
    # Save final optimized submission
    optimized_df.to_csv(output_path, index=False)
    print(f"\nEnsemble submission saved to {output_path}")
    
    # Save detailed analysis for further inspection
    analysis_path = 'ensemble_optimization_analysis.csv'
    analysis_df = pd.DataFrame({
        'Row': range(len(summary['optimal_texts'])),
        'Optimized_Text': summary['optimal_texts'],
        'Perplexity': summary['optimal_scores'],
        'Source': summary['optimal_sources']
    })
    analysis_df.to_csv(analysis_path, index=False)
    print(f"Detailed analysis saved to {analysis_path}")


def run_ensemble_optimizer():
    """
    Main function to run the ensemble optimization process.
    
    This function orchestrates the entire workflow:
    1. Initialize the perplexity evaluator
    2. Discover and load all submission files
    3. Evaluate all submissions to find optimal texts
    4. Generate and save the optimized ensemble submission
    """
    # Initialize perplexity evaluator
    evaluator = TextPerplexityEvaluator()
    
    # Find all submission files
    submissions = discover_submission_files('/kaggle/input')
    
    # Evaluate all submissions and find optimal texts
    scores_df, summary = analyze_submission_perplexity(submissions, evaluator)
    
    # Save detailed evaluation scores for reference
    scores_df.to_csv('submission_perplexity_analysis.csv')
    print("\nDetailed perplexity analysis saved to submission_perplexity_analysis.csv")
    
    # Create and save optimized ensemble submission
    generate_ensemble_submission(submissions[0][1], summary, 'submission.csv')


if __name__ == "__main__":
    run_ensemble_optimizer()
from datasets import load_dataset
ds = load_dataset("shrijayan/gov_myscheme", split="train")
print(ds[0].keys())

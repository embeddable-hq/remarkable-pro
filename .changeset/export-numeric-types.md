---
'@embeddable.com/remarkable-pro': patch
---

Fix numeric values in CSV and XLSX exports. Numeric measures and number dimensions are now exported as numbers (previously everything was a string, so Excel treated numbers as text), and CSV cells are only quoted when needed instead of always.

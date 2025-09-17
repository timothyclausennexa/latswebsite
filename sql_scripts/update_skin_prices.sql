-- Update skin prices to be 20x more expensive
UPDATE public.skins
SET price = price * 20
WHERE id != 'default'; -- Keep default skin free

-- Show updated prices
SELECT id, name, price, rarity FROM public.skins ORDER BY price;
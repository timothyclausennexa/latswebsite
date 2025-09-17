/**
 * Shortens a Solana contract address for display purposes.
 * @param {string | null} ca The full contract address.
 * @returns {string} The shortened address (e.g., "AbCd...eF") or "not set" if null.
 */
export const shortCA = (ca: string | null): string => {
    if (!ca) {
        return "not set";
    }
    return `${ca.slice(0, 4)}...${ca.slice(-4)}`;
};

export const getPurchaseLinks = (isbn: string) => {
    return {
        amazon: `https://www.amazon.ca/s?k=${isbn}`,
        googleBooks: `https://www.google.com/search?tbm=bks&q=ISBN:${isbn}`,
    }
}
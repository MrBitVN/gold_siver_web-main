import axios from 'axios';

const API_URL = 'https://api_gold.thinkdiff.us/market_report_1day';

export const fetchMarketReport = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching market report:', error);
        return null;
    }
};

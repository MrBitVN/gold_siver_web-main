// Chuyển từ require sang import để chạy được với file .js trong type: module
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

// Cho phép Frontend truy cập để tránh lỗi CORS
app.use(cors());

app.get('/api/sge/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const targetUrl = `https://api_gold.thinkdiff.us/shanghai_gold_exchange/${year}/${month}`;
        console.log(`Đang lấy dữ liệu từ: ${targetUrl}`);
        
        const response = await axios.get(targetUrl);
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi API gốc:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('-----------------------------------------');
    console.log(`SERVER BACKEND ĐÃ CHẠY TẠI PORT ${PORT}`);
    console.log(`Link test: http://127.0.0.1:${PORT}/api/sge/2025/12`);
    console.log('-----------------------------------------');
});
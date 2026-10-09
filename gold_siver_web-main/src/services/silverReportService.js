export async function getSilverReport() {
  // 1️⃣ Ngày hiện tại
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const dateStr = `${day}_${month}_${year}`;
  console.log("📅 DATE:", dateStr);

  // 2️⃣ Lấy danh sách file trong ngày
  const listRes = await fetch(`/api_gold/all_json_1_day/${dateStr}`);
  const listJson = await listRes.json();

  console.log("📦 FILE LIST:", listJson);

  if (!listJson?.data?.length) {
    throw new Error("Không có file dữ liệu trong ngày");
  }

  let silverData = null;

  // 3️⃣ DUYỆT NGƯỢC – tìm file mới nhất có silver_price
  for (let i = listJson.data.length - 1; i >= 0; i--) {
    const fileName = listJson.data[i].link.split("/").pop();
    console.log("🔍 CHECK FILE:", fileName);

    const detailRes = await fetch(
      `/api_gold/view_full_data_json/${dateStr}/${fileName}`
    );

    const detailJson = await detailRes.json();

    // ✅ silver_price NẰM Ở ROOT
    if (detailJson?.silver_price) {
      silverData = detailJson.silver_price;
      console.log("✅ FOUND SILVER:", silverData);
      break;
    }
  }

  if (!silverData) {
    throw new Error("Không tìm thấy dữ liệu bạc trong ngày");
  }

  // 4️⃣ Trả dữ liệu cho bảng
  const COUNTRIES = [
    "United States",
    "United Kingdom",
    "Switzerland",
    "India",
    "Japan",
    "South Korea",
    "Russia",
    "United Arab Emirates",
  ];

  return COUNTRIES.map((country, index) => ({
    id: index,
    country,
    market: "International",
    unit: "USD/oz",
    buy: Number(silverData.price_usd),
    sell: Number(silverData.price_usd),
    time: silverData.time || "",
  }));
}

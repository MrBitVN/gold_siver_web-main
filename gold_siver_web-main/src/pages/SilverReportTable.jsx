const SilverReportTable = ({ data = [] }) => {
  if (!Array.isArray(data)) {
    return <div>Không có dữ liệu bảng bạc</div>;
  }

  return (
    <div className="silver-table-wrapper">
      <table className="silver-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Quốc gia</th>
            <th>Thị trường</th>
            <th>Đơn vị</th>
            <th>Giá (USD)</th>
            <th>Nguồn</th>
            <th>Cập nhật</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id ?? index}>
              <td>{index + 1}</td>
              <td>{item.country}</td>
              <td>Silver Market</td>
              <td>USD/oz</td>
              <td>{item.priceUSD}</td>
              <td>{item.source}</td>
              <td>{item.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SilverReportTable;

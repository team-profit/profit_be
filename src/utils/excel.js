const ExcelJS = require('exceljs');

exports.generateExcel = async (deliveries) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Deliveries');

  sheet.columns = [
    { header: '상차지', key: 'place', width: 20 },
    { header: '수익', key: 'profit', width: 15 },
    { header: '수금 여부', key: 'isPaymentCompleted', width: 15 },
    { header: '운송 완료 여부', key: 'isTransportCompleted', width: 15 },
  ];

  deliveries.forEach((d) => {
    sheet.addRow({
      place: d.transportInfo.loadingLocation?.address,
      profit: d.transportInfo.netProfit,
      isPaymentCompleted: d.transportInfo.isPaymentCompleted,
      isTransportCompleted: d.transportInfo.isTransportCompleted,
    });
  });

  return workbook;
};

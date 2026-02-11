const Delivery = require('../models/Delivery');
const { generateExcel } = require('../utils/excel');

exports.getCalendarData = async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    const result = {};

    deliveries.forEach((d) => {
      const date = d.transportInfo?.dateAndTime?.startDateAndTime;
      if (!date) return;

      const ym = date.toISOString().slice(0, 7);

      if (!result[ym]) {
        result[ym] = {
          summary: {
            netProfit: 0,
            receivedAmount: 0,
            totalExpenseAmount: 0,
          },
          deliveries: [],
        };
      }

      result[ym].summary.netProfit += d.transportInfo.netProfit;
      result[ym].summary.receivedAmount += d.transportInfo.receivedAmount;
      result[ym].summary.totalExpenseAmount +=
        d.transportInfo.totalExpenseAmount;

      result[ym].deliveries.push({
        deliveryId: d.deliveryId,
        place: d.transportInfo.loadingLocation.address,
        dateAndTime: d.transportInfo.dateAndTime,
      });
    });

    return res.json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ message: '캘린더 데이터를 불러오는 중 오류가 발생했습니다' });
  }
};

exports.exportCalendar = async (req, res) => {
  try {
    const { yearMonth } = req.query;

    if (!yearMonth) {
      return res.status(400).json({ message: '연월(yearMonth)이 필요합니다' });
    }

    const start = new Date(`${yearMonth}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const deliveries = await Delivery.find({
      'transportInfo.dateAndTime.startDateAndTime': {
        $gte: start,
        $lt: end,
      },
    });

    if (!deliveries.length) {
      return res.status(204).json({ message: '해당 월에 데이터가 없습니다' });
    }

    const workbook = await generateExcel(deliveries);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="deliveries-${yearMonth}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res
      .status(500)
      .json({ message: '엑셀 파일 생성 중 오류가 발생했습니다' });
  }
};

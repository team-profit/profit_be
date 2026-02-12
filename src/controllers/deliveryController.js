const { default: mongoose } = require('mongoose');
const Delivery = require('../models/Delivery');
const getNextSequence = require('../services/getNextSequence');

// 오늘 리스트
exports.getTodayList = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const deliveries = await Delivery.find({
      'transportInfo.dateAndTime.startDateAndTime': {
        $gte: start,
        $lte: end,
      },
    });

    const todayList = deliveries.map((d) => ({
      deliveryId: d.deliveryId,
      place: d.transportInfo.loadingLocation.address,
      time: {
        startTime: d.transportInfo.dateAndTime.startDateAndTime,
        endTime: d.transportInfo.dateAndTime.endDateAndTime,
      },
    }));

    return res.json({ todayList });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '오늘 목록을 불러오는 중 오류가 발생했습니다' });
  }
};

// 상세보기
exports.getDeliveryDetail = async (req, res) => {
  try {
    if (!req.params.deliveryId) {
      return res.status(400).json({ message: 'deliveryId가 필요합니다' });
    }

    const delivery = await Delivery.findOne({
      deliveryId: req.params.deliveryId,
    });

    if (!delivery) {
      return res
        .status(404)
        .json({ message: '해당 데이터를 찾을 수 없습니다' });
    }

    return res.json(delivery);
  } catch (error) {
    return res
      .status(500)
      .json({ message: '상세 조회 중 오류가 발생했습니다' });
  }
};

// 게시글 생성
exports.createDelivery = async (req, res) => {
  try {
    const { transportInfo, shipperInfo } = req.body;

    if (!transportInfo || !shipperInfo) {
      return res.status(400).json({ message: '필수 데이터가 누락되었습니다' });
    }

    const expenses = transportInfo.expenses || [];

    const totalExpenseAmount = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );

    const netProfit = (transportInfo.receivedAmount || 0) - totalExpenseAmount;

    const deliveryId = await getNextSequence('delivery');

    const newDelivery = await Delivery.create({
      deliveryId,
      transportInfo: {
        ...transportInfo,
        totalExpenseAmount,
        netProfit,
        dateAndTime: {
          startDateAndTime: new Date(),
        },
      },
      shipperInfo,
    });

    return res.status(201).json(newDelivery);
  } catch (error) {
    return res
      .status(500)
      .json({ message: '데이터 생성 중 오류가 발생했습니다' });
  }
};

// 수정
exports.updateDelivery = async (req, res) => {
  try {
    if (!req.params.deliveryId) {
      return res.status(400).json({ message: 'deliveryId가 필요합니다' });
    }

    const { transportInfo, shipperInfo } = req.body;

    const expenses = transportInfo.expenses || [];

    const totalExpenseAmount = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );

    const netProfit = (transportInfo.receivedAmount || 0) - totalExpenseAmount;

    let updateData = {
      transportInfo: {
        ...transportInfo,
        totalExpenseAmount,
        netProfit,
      },
      shipperInfo,
    };

    if (transportInfo.isTransportCompleted) {
      updateData.transportInfo.dateAndTime = {
        ...transportInfo.dateAndTime,
        endDateAndTime: new Date(),
      };
    }

    const updated = await Delivery.findOneAndUpdate(
      { deliveryId: req.params.deliveryId },
      updateData,
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: '수정할 데이터를 찾을 수 없습니다' });
    }

    return res.json(updated);
  } catch (error) {
    return res
      .status(500)
      .json({ message: '데이터 수정 중 오류가 발생했습니다' });
  }
};

exports.deleteDelivery = async (req, res) => {
  try {
    const deleted = await Delivery.findOneAndDelete({
      deliveryId: Number(req.params.deliveryId),
    });

    if (!deleted) {
      return res.status(404).json({
        message: '삭제할 데이터가 없습니다.',
      });
    }

    return res.json({
      message: '정상적으로 삭제되었습니다.',
      deliveryId: deleted.deliveryId,
    });
  } catch (error) {
    return res.status(500).json({
      message: '데이터 삭제 중 오류가 발생했습니다',
    });
  }
};

// 수금 완료
exports.collectPayment = async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: Number(req.params.deliveryId) },
      { 'transportInfo.isPaymentCompleted': true },
      { new: true },
    );

    if (!delivery) {
      return res
        .status(404)
        .json({ message: '해당 데이터를 찾을 수 없습니다' });
    }

    return res.json({
      deliveryId: delivery.deliveryId,
      isPaymentCompleted: delivery.transportInfo.isPaymentCompleted,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '수금 처리 중 오류가 발생했습니다' });
  }
};

// 수금 취소
exports.cancelCollect = async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: Number(req.params.deliveryId) },
      { 'transportInfo.isPaymentCompleted': false },
      { new: true },
    );

    if (!delivery) {
      return res
        .status(404)
        .json({ message: '해당 데이터를 찾을 수 없습니다' });
    }

    return res.json({
      deliveryId: delivery.deliveryId,
      isPaymentCompleted: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '수금 취소 중 오류가 발생했습니다' });
  }
};

// 운송 완료
exports.completeTransport = async (req, res) => {
  try {
    const now = new Date();

    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: Number(req.params.deliveryId) },
      {
        'transportInfo.isTransportCompleted': true,
        'transportInfo.dateAndTime.endDateAndTime': now,
      },
      { new: true },
    );

    if (!delivery) {
      return res
        .status(404)
        .json({ message: '해당 데이터를 찾을 수 없습니다' });
    }

    return res.json({
      deliveryId: delivery.deliveryId,
      endDateAndTime: delivery.transportInfo.dateAndTime.endDateAndTime,
      isTransportCompleted: delivery.transportInfo.isTransportCompleted,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '운송 완료 처리 중 오류가 발생했습니다' });
  }
};

// 운송 취소
exports.cancelTransport = async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: Number(req.params.deliveryId) },
      {
        'transportInfo.isTransportCompleted': false,
        'transportInfo.dateAndTime.endDateAndTime': null,
      },
      { new: true },
    );

    if (!delivery) {
      return res
        .status(404)
        .json({ message: '해당 데이터를 찾을 수 없습니다' });
    }

    return res.json({
      deliveryId: delivery.deliveryId,
      endDateAndTime: null,
      isTransportCompleted: delivery.transportInfo.isTransportCompleted,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: '운송 취소 처리 중 오류가 발생했습니다' });
  }
};

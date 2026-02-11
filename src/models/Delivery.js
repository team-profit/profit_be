const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: String,
  amount: Number,
});

const locationSchema = new mongoose.Schema({
  address: String,
  detailAddress: String,
  postalAddress: String,
});

const deliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: Number,
      unique: true,
    },
    transportInfo: {
      isPaymentCompleted: { type: Boolean, default: false },
      isTransportCompleted: { type: Boolean, default: false },

      receivedAmount: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },

      expenses: [expenseSchema],
      totalExpenseAmount: { type: Number, default: 0 },

      loadingLocation: locationSchema,
      unloadingLocation: locationSchema,

      dateAndTime: {
        startDateAndTime: Date,
        endDateAndTime: Date,
      },
    },

    shipperInfo: {
      companyName: String,
      businessRegistrationNumber: String,
      name: String,
      phoneNumber: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Delivery', deliverySchema);

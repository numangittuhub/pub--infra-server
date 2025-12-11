// src/controllers/
import { stripe } from "../config/stripe.js";
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

// Boost Issue Payment (100 TK)
export const createBoostSession = async (req, res) => {
  const { issueId } = req.body;
  const issue = await Issue.findById(issueId);

  if (!issue || issue.reportedBy.toString() !== req.user._id.toString()) {
    return res.status(400).json({ message: "Invalid issue" });
  }
  if (issue.isBoosted) return res.status(400).json({ message: "Already boosted" });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: { name: "Priority Boost for Issue" },
          unit_amount: 10000, // 100 TK = 10000 paisa
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&issueId=${issueId}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    metadata: { issueId: issue._id.toString(), userId: req.user._id.toString(), type: "boost" },
  });

  res.json({ url: session.url });
};

// Premium Subscription (1000 TK)
export const createSubscriptionSession = async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: { name: "Premium Subscription (Unlimited Reports)" },
          unit_amount: 100000, // 1000 TK
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=premium`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    metadata: { userId: req.user._id.toString(), type: "premium" },
  });

  res.json({ url: session.url });
};

// Webhook – সবচেয়ে গুরুত্বপূর্ণ
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { type, issueId, userId } = session.metadata;

    if (type === "boost" && issueId) {
      await Issue.findByIdAndUpdate(issueId, {
        priority: "high",
        isBoosted: true,
        boostedAt: new Date(),
        $push: {
          timeline: {
            status: "pending",
            message: "Issue boosted to HIGH priority (Paid ৳100)",
            by: userId,
            byRole: "citizen",
          },
        },
      });
    }

    if (type === "premium" && userId) {
      await User.findByIdAndUpdate(userId, {
        isPremium: true,
      });
    }
  }

  res.json({ received: true });
};

// PDF Invoice Generate
export const generateInvoice = async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const doc = new PDFDocument();
  let buffers = [];

  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {
    const pdfData = Buffer.concat(buffers);
    res
      .writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${sessionId}.pdf`,
      })
      .end(pdfData);
  });

  doc.fontSize(20).text("Payment Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice ID: ${sessionId}`);
  doc.text(`Amount: ৳${session.amount_total / 100}`);
  doc.text(`Status: ${session.payment_status.toUpperCase()}`);
  doc.text(`Date: ${new Date(session.created * 1000).toLocaleDateString()}`);
  doc.text(`Customer: ${session.customer_details?.name || "Citizen"}`);
  doc.moveDown();
  doc.text("Thank you for supporting public infrastructure!", { align: "center" });
  doc.end();
};
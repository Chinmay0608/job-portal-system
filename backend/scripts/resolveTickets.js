const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function checkAndResolve() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/user');
  const SupportTicket = require('../models/SupportTicket');
  let createNotification = null;
  try {
    const notif = require('../services/notificationService');
    createNotification = notif.createNotification;
  } catch (_) {}

  const tickets = await SupportTicket.find({}).sort({ createdAt: -1 });
  console.log(`Total tickets in database: ${tickets.length}`);

  const pending = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
  console.log(`Pending tickets to resolve: ${pending.length}`);

  for (const t of pending) {
    console.log(`\nResolving Ticket #${String(t._id).slice(-6)}:`);
    console.log(` - Email: ${t.email}`);
    console.log(` - Category: ${t.category || 'other'}`);
    console.log(` - Description: ${t.description.slice(0, 60)}...`);

    t.status = 'resolved';
    t.autoResolved = false;
    t.agentLog.push({
      action: 'admin_resolved',
      detail: 'Issue investigated and resolved by administrator.',
      ts: new Date(),
    });

    await t.save();
    console.log(` -> Status updated to 'resolved'.`);

    // In-app notification to ticket owner if linked
    if (t.user && createNotification) {
      try {
        await createNotification({
          recipient: t.user,
          sender: null,
          type: 'support_update',
          title: `Support Ticket Resolved #${String(t._id).slice(-6)}`,
          message: `Your issue regarding "${t.description.slice(0, 80)}" has been resolved.`,
          priority: 'normal',
          actionUrl: '/help',
        });
        console.log(` -> In-app notification sent to candidate ${t.user}`);
      } catch (notifErr) {
        console.log(` -> Notification notice: ${notifErr.message}`);
      }
    }
  }

  const openCount = await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } });
  const resolvedCount = await SupportTicket.countDocuments({ status: 'resolved' });
  console.log(`\n========================================`);
  console.log(`Summary:`);
  console.log(` Open / In-Progress Tickets: ${openCount}`);
  console.log(` Total Resolved Tickets:    ${resolvedCount}`);
  console.log(`========================================`);

  await mongoose.disconnect();
}

checkAndResolve().catch(e => {
  console.error('Resolution error:', e);
  process.exit(1);
});

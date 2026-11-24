// Numbers for the admin dashboard (same calculation as the app's src/utils/adminStats.js).
import { round2 } from "@/lib/wallet";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
//trun all users orders and accounts into the number shown in the admin dashboard 
// Cancelled orders are not counted as sales. "Members" = non-admin accounts.

//it recieves the orders users and current date 
export function computeStats(orders, users, now = new Date()) {
  //all orders that are sales (not cancelled)
  const valid = orders.filter((o) => o.status !== "cancelled");
  //ca;culate today and total sales 
  const sum = (list) => round2(list.reduce((total, o) => total + (o.total || 0), 0));
  //to find which order belongs to today
  const todayKey = dayKey(now);
  const todayOrders = valid.filter((o) => dayKey(new Date(o.createdAt)) === todayKey);
  const week = [];
  //prepare the seven day charts
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(day);
    week.push({
      label: DAY_NAMES[day.getDay()],
      count: valid.filter((o) => dayKey(new Date(o.createdAt)) === key).length,
    });
  }
  const products = {};
  const stores = {};
  valid.forEach((o) => {
    (o.items || []).forEach((item) => {
      //rank the product and stores 
      products[item.name] = (products[item.name] || 0) + (item.quantity || 0);
    });
    if (!stores[o.storeName]) stores[o.storeName] = { name: o.storeName, orders: 0, sales: 0 };
    stores[o.storeName].orders += 1;
    stores[o.storeName].sales = round2(stores[o.storeName].sales + (o.total || 0));
  });
  const topProducts = Object.entries(products)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const topStores = Object.values(stores)
    .sort((a, b) => b.orders - a.orders || b.sales - a.sales)
    .slice(0, 5);
  const members = users.filter((u) => u.role !== "admin");
  const frozenUsers = members.filter((u) => u.frozen).length;
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const newUsers = members.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= weekAgo).length;
  return {
    salesToday: sum(todayOrders),
    ordersToday: todayOrders.length,
    totalSales: sum(valid),
    totalOrders: valid.length,
    cancelled: orders.length - valid.length,
    newUsers,
    totalUsers: members.length,
    activeUsers: members.length - frozenUsers,
    frozenUsers,
    admins: users.length - members.length,
    week,
    topProducts,
    topStores,
  };

  //example of today having 3 orders one cancelled one pending and one confirmed 
  //so it will be sales todays = confirmed 
  //orders today =2 pending and completed 
  //cancelled today =1 in the admin dashboard 
}

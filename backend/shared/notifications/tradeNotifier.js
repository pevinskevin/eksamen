import { tradeNotificationEmitter } from '../events/tradeNotificationEmitter.js';
import { ORDER_STATUS } from '../validators/validators.js';

export function initializeTradeNotifier(io) {
    tradeNotificationEmitter.on('tradeExecuted', async (eventData) => {

        if (!eventData) return console.error("No data received - order is null/undefined.")

        const updatedOrder = eventData;
        const { userId, orderId } = eventData;
        const roomName = `user_${userId}`;

        const notificationPayload = {
            type: ORDER_STATUS.FULLY_FILLED, // Clear type for the frontend to distinguish
            message: `Your order #${orderId} has been filled.`,
            order: updatedOrder, // Send the whole order object for context
        };
        try {
            io.to(roomName).emit('tradeNotification', notificationPayload);
        } catch (error) {
            console.error(
                `tradeNotifier: Error sending WebSockeat notification to oom ${roomName} for order ${orderId}.`
            );
        }
    });
}

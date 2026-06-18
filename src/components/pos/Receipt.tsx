import { Order } from "@/types/order";
import { formatDateTime, formatVnd, getOrderItemUnitPrice } from "@/utils/format";

interface ReceiptProps {
  order: Order;
}

export function Receipt({ order }: ReceiptProps) {
  return (
    <div 
      className="receipt-58mm" 
      style={{ 
        fontFamily: "'Courier New', Courier, monospace",
        backgroundColor: 'white'
      }}
    >
      <div className="text-center mb-4">
        <h2 className="text-[14px] font-bold uppercase">Convenience Store</h2>
        <p className="text-[10px]">123 Street Name, City</p>
        <p className="text-[10px]">Tel: 0123 456 789</p>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Order:</span>
          <span className="font-mono">{order.id.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{order.cashierName || "N/A"}</span>
        </div>
        {order.membershipLevel && (
          <div className="flex justify-between">
            <span>Member:</span>
            <span>{order.membershipLevel}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-dashed border-black font-bold">
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="py-1 pr-1 leading-tight">
                {item.productName}
              </td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1">{formatVnd(getOrderItemUnitPrice(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Total:</span>
          <span>{formatVnd(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Member Discount:</span>
          <span>-{formatVnd(order.membershipDiscountAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Discount:</span>
          <span>-{formatVnd(order.discountAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-[13px] pt-1">
          <span>FINAL:</span>
          <span>{formatVnd(order.finalAmount)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="text-center mt-4 space-y-1">
        <p className="text-[11px]">Thank you for shopping!</p>
        <p className="text-[10px]">Please keep your receipt.</p>
        <div className="mt-2 flex justify-center">
          <div className="border border-black px-2 py-1 font-mono text-[10px]">
            {order.id.slice(0, 12)}
          </div>
        </div>
      </div>
      
      {/* Spacer for thermal printers to prevent cutting text */}
      <div className="h-8"></div>
    </div>
  );
}

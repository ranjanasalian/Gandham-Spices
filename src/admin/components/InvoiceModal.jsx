import { Printer, Download, MessageSquare, X, CheckCircle2, Clock, Building2, MapPin, Phone, Mail, FileText, Tag, Sparkles } from 'lucide-react';

export default function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;

  const customer = invoice.customer || {};
  const items = invoice.items || [];
  
  // Pricing & Customer Type Checks
  const isWholesalePrice = items.some(item => (item.priceType || invoice.priceType || 'Wholesale Price') === 'Wholesale Price');
  const custTypeRaw = (customer.customerClassification || customer.customerType || 'Retailer').toLowerCase();
  const isRetailer = custTypeRaw.includes('retail') || custTypeRaw.includes('wholesale') || custTypeRaw.includes('shop');

  // Case 1: Retailer + Wholesale Price -> Show Wholesale Column
  // Case 2: Direct Customer + MRP Price -> Hide Wholesale Column, Full MRP, No Discount
  // Case 3: Direct Customer + Wholesale Price -> Hide Wholesale Column, Show MRP in table, Apply 20% Discount below
  const showWholesaleColumn = isRetailer && isWholesalePrice;

  // Subtotal & Discount calculations
  const mrpSubtotal = items.reduce((acc, item) => acc + (item.quantityGiven * (item.mrp || item.wholesalePrice || 0)), 0);
  const wholesaleSubtotal = items.reduce((acc, item) => acc + (item.quantityGiven * (item.wholesalePrice || item.mrp || 0)), 0);
  
  // Effective totals based on selected price type & customer mode
  let invoiceSubtotal = mrpSubtotal;
  let discountVal = 0;
  let calculatedGrandTotal = mrpSubtotal;

  if (isWholesalePrice) {
    discountVal = Math.max(0, mrpSubtotal - wholesaleSubtotal);
    calculatedGrandTotal = wholesaleSubtotal;
  } else {
    calculatedGrandTotal = mrpSubtotal;
  }

  const tax = invoice.tax || 0;
  const grandTotal = invoice.grandTotal || (calculatedGrandTotal + tax);
  const amountPaid = invoice.amountReceived !== undefined ? invoice.amountReceived : grandTotal;
  const balanceDue = invoice.balanceAmount !== undefined ? invoice.balanceAmount : Math.max(0, grandTotal - amountPaid);
  const isPaid = balanceDue <= 0;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const rawPhone = customer.phoneNumber || customer.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    
    let itemsText = items.map(item => {
      if (showWholesaleColumn) {
        return `- ${item.productName} (${item.quantityGiven}x @ Wholesale ₹${item.wholesalePrice} [MRP ₹${item.mrp || item.wholesalePrice}]) = ₹${(item.quantityGiven * item.wholesalePrice).toFixed(2)}`;
      } else {
        return `- ${item.productName} (${item.quantityGiven}x @ MRP ₹${item.mrp || item.wholesalePrice}) = ₹${(item.quantityGiven * (item.mrp || item.wholesalePrice)).toFixed(2)}`;
      }
    }).join('\n');

    let summaryBlock = '';
    if (isWholesalePrice) {
      const discountLabel = isRetailer ? 'Retailer Trade Margin (20%)' : 'Discount (20%)';
      summaryBlock = `Subtotal (at MRP): ₹${mrpSubtotal.toFixed(2)}\n${discountLabel}: -₹${discountVal.toFixed(2)}\n`;
    }

    let marginOrDiscountNote = '';
    if (isWholesalePrice) {
      marginOrDiscountNote = isRetailer
        ? '*Note:* Includes 20% Retailer Trade Margin.'
        : '*Note:* Includes 20% Direct Customer Discount.';
    }
    
    const message = `*GANDHAM SPICES — TAX INVOICE*
--------------------------------
*Invoice No:* ${invoice.invoiceNumber}
*Date:* ${invoice.date}
*Customer / Shop:* ${customer.shopName || invoice.shopName || 'Valued Customer'}
${customer.contactName ? `*Contact:* ${customer.contactName}\n` : ''}
*Order Breakdown:*
${itemsText}

--------------------------------
${summaryBlock}*Grand Total:* ₹${grandTotal.toFixed(2)}
*Amount Paid:* ₹${amountPaid.toFixed(2)}
*Balance Due:* ₹${balanceDue.toFixed(2)}
*Status:* ${isPaid ? 'PAID ✅' : 'PENDING ⚠️'}
${marginOrDiscountNote ? `\n${marginOrDiscountNote}` : ''}

Thank you for choosing Gandham Spices!
Website: https://gandhamspices.in`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:p-0 print:m-0 print:overflow-visible">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-0 print:hidden" onClick={onClose} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4 text-center print:block print:p-0 print:m-0 print:min-h-0 print:static">
        <div className="relative my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-3xl text-left shadow-2xl animate-fade-in-up text-xs space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none print:static print:transform-none print:animate-none">

          {/* Top Bar Action Controls (Hidden on Print) */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-saffron" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Official Tax Invoice</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {isPaid ? 'Paid' : 'Payment Pending'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {isWholesalePrice ? 'Wholesale Pricing' : 'MRP Retail Pricing'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer"
                title="Share Invoice on WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-saffron hover:bg-orange-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer"
                title="Print or Download PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="printable-invoice-content bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Header: Company Info & Invoice Metadata */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-saffron to-orange-500 flex items-center justify-center text-white font-black text-sm shadow">
                    GS
                  </div>
                  <h1 className="text-xl font-black font-display text-orange-600 tracking-tight">Gandham Spices</h1>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold">Authentic Artisan Spices & Premium Masalas</p>
                <p className="text-[10px] text-slate-500">Near Bus Stand, Brahmavar, Udupi, Karnataka, India - 576213</p>
                <p className="text-[10px] text-slate-500">Phone: +91 94801 23456 | GSTIN: 29AAAAA0000A1Z5</p>
              </div>

              <div className="text-right space-y-1">
                <h2 className="text-lg font-black uppercase text-slate-800 tracking-wide">TAX INVOICE</h2>
                <p className="text-xs font-bold text-saffron"># {invoice.invoiceNumber}</p>
                <p className="text-[11px] text-slate-500 font-medium">Date: <strong className="text-slate-800">{invoice.date}</strong></p>
                <div className="pt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
                    {isPaid ? 'Payment Status: PAID' : `Balance Due: ₹${balanceDue.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Billed To / Buyer Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To (Buyer Shop / Customer):</h4>
                <p className="font-bold text-sm text-slate-900">{customer.shopName || invoice.shopName || 'Customer'}</p>
                {customer.contactName && <p className="text-slate-600">Attn: {customer.contactName}</p>}
                {customer.address && <p className="text-slate-500 mt-0.5">{customer.address}</p>}
                {customer.phoneNumber && <p className="text-slate-500 font-medium">Phone: {customer.phoneNumber}</p>}
              </div>
              <div className="sm:text-right space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch & Billing Specs:</h4>
                <p className="text-slate-600">Classification: <strong className="text-slate-800">{customer.customerClassification || customer.customerType || 'Retailer'}</strong></p>
                <p className="text-slate-600">Price Structure: <strong className="text-slate-800">{isWholesalePrice ? 'Wholesale Trade Rate' : 'MRP Retail Rate'}</strong></p>
                <p className="text-slate-600">Payment Terms: <strong className="text-slate-800">{isPaid ? 'Immediate Settlement' : 'Credit Dues'}</strong></p>
              </div>
            </div>

            {/* Product Breakdown Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Item</th>
                    <th className="py-2.5 px-3">Batch #</th>
                    <th className="py-2.5 px-3 text-center">Qty (Packs)</th>
                    {showWholesaleColumn ? (
                      <>
                        <th className="py-2.5 px-3 text-right">MRP Price</th>
                        <th className="py-2.5 px-3 text-right">Wholesale Price</th>
                      </>
                    ) : (
                      <th className="py-2.5 px-3 text-right">MRP Price</th>
                    )}
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {items.map((item, idx) => {
                    const mrpPrice = item.mrp || item.wholesalePrice || 0;
                    const wholesalePrice = item.wholesalePrice || mrpPrice;

                    // If showWholesaleColumn (Case 1), row total is wholesale total.
                    // If !showWholesaleColumn (Case 2 & 3), row total is displayed at MRP total!
                    const rowUnitPrice = showWholesaleColumn ? wholesalePrice : mrpPrice;
                    const rowTotalAmount = item.quantityGiven * rowUnitPrice;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{item.productName}</span>
                          {item.packSize && <span className="text-[10px] text-slate-500">Pack Size: {item.packSize}</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{item.batchNumber || 'N/A'}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantityGiven}</td>
                        
                        {showWholesaleColumn ? (
                          <>
                            <td className="py-3 px-3 text-right text-slate-700 font-semibold">₹{mrpPrice}</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">₹{wholesalePrice}</td>
                          </>
                        ) : (
                          <td className="py-3 px-3 text-right font-bold text-slate-900">₹{mrpPrice}</td>
                        )}

                        <td className="py-3 px-3 text-right font-black text-slate-900">₹{rowTotalAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Special Pricing Margin / Discount Note Banner */}
            {isWholesalePrice && (
              <div className={`p-3 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                isRetailer 
                  ? 'bg-amber-50 border-amber-200 text-amber-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>
                  {isRetailer 
                    ? 'Retailer Benefit: Includes 20% Retailer Trade Margin.' 
                    : 'Special Offer: Includes 20% Direct Customer Discount.'}
                </span>
              </div>
            )}

            {/* Financial Summary Calculation Box */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal {isWholesalePrice ? '(at MRP)' : ''}:</span>
                  <span className="font-semibold text-slate-900">₹{mrpSubtotal.toFixed(2)}</span>
                </div>
                
                {isWholesalePrice && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>{isRetailer ? 'Retailer Margin (20%):' : 'Discount (20%):'}</span>
                    <span>-₹{discountVal.toFixed(2)}</span>
                  </div>
                )}

                {!isWholesalePrice && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-semibold text-slate-900">₹0.00</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax:</span>
                  <span className="font-semibold text-slate-900">₹0.00 (Inclusive)</span>
                </div>

                <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-saffron text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span>₹{amountPaid.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-800">
                  <span>Balance Dues:</span>
                  <span className={balanceDue > 0 ? 'text-red-600 font-black' : 'text-slate-400'}>
                    ₹{balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Authoritative Seal & Signature Area */}
            <div className="border-t border-slate-200 pt-6 flex justify-between items-end text-[10px] text-slate-500">
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Terms & Conditions:</p>
                <p>1. All goods supplied are fresh small-batch spice blends.</p>
                <p>2. Subject to Udupi Jurisdiction.</p>
                <p>3. This is a computer-generated tax invoice.</p>
              </div>
              <div className="text-right space-y-8">
                <p className="font-bold text-slate-800">For Gandham Spices</p>
                <p className="border-t border-slate-400 pt-1 font-semibold text-slate-600 uppercase tracking-wider">Authorized Signatory</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

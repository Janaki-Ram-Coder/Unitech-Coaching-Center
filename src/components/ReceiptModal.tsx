import React, { useRef, useEffect } from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { PaymentInstallment, Student } from '../types';

interface ReceiptModalProps {
  payment: PaymentInstallment | null;
  student?: Student | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, student, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!payment) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [payment]);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 transition-all duration-300 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center p-0 sm:p-2 text-center">
        <div className="relative w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col text-left transform transition-all">
          {/* Top Control Bar */}
          <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-lg">Official Fee Payment Receipt</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-extrabold transition-colors shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-blue-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Receipt Content */}
          <div ref={printRef} className="p-8 space-y-6 print:p-0 overflow-y-auto overscroll-contain flex-1 focus:outline-none">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow">
                  O
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    ORITECH COMPUTER TRAINING INSTITUTE
                  </h1>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    ISO 9001:2015 Certified Educational Institute
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha • Contact: +91 9437235124
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                {payment.status}
              </span>
              <p className="text-xs text-slate-500">Receipt No.</p>
              <p className="text-base font-mono font-bold text-blue-700">{payment.receiptNo}</p>
            </div>
          </div>

          {/* Student & Course Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-medium">STUDENT NAME</p>
              <p className="text-base font-bold text-slate-900">{payment.studentName}</p>
              <p className="text-xs font-mono text-slate-600 mt-1">Roll No: {payment.rollNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">COURSE ENROLLED</p>
              <p className="text-base font-bold text-slate-900">{payment.courseTitle}</p>
              <p className="text-xs text-slate-600 mt-1">Date: {payment.paymentDate}</p>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-left text-xs uppercase font-semibold">
                <th className="p-3 rounded-l-lg">Description</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-right rounded-r-lg">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              <tr>
                <td className="p-3">
                  <span className="font-semibold">{payment.remarks || 'Course Fee Installment Payment'}</span>
                  <p className="text-xs text-slate-500">Official Installment Credit</p>
                </td>
                <td className="p-3 font-medium text-slate-700">{payment.paymentMethod}</td>
                <td className="p-3 text-right font-bold text-slate-900 text-base">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-slate-100 rounded-lg text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Course Fee</p>
              <p className="text-sm font-bold text-slate-800">
                ₹{(student?.totalFee || payment.amount).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <p className="text-[10px] text-emerald-600 uppercase font-bold">Amount Paid (Cumulative)</p>
              <p className="text-sm font-extrabold text-emerald-800">
                ₹{(student?.paidAmount || payment.amount).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-[10px] text-amber-600 uppercase font-bold">Remaining Balance</p>
              <p className="text-sm font-extrabold text-amber-800">
                ₹{(student?.dueAmount ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {payment.nextDueDate && payment.nextDueDate !== '-' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 font-medium">
              <span>Next Scheduled Due Date:</span>
              <span className="font-bold text-blue-700 font-mono text-sm">{payment.nextDueDate}</span>
            </div>
          )}

          {/* Signatures & Stamp */}
          <div className="pt-8 flex items-end justify-between border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Computer Generated Computerized Receipt • Valid without physical seal</span>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-semibold text-slate-700">Authorized Signature</p>
              <p className="text-[10px] text-slate-400">Oritech Accounts Section</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

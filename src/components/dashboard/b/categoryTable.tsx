"use client";

import React from "react";
import { Pencil, Trash2, SearchX, Inbox } from "lucide-react";

interface CategoryTableProps {
  data: any[];
  isSearching: boolean;
}

const CategoryTable = ({ data, isSearching }: CategoryTableProps) => {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden font-mukta">
      <div 
        className="max-h-[400px] overflow-y-auto overflow-x-auto 
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f5f6fa] border-b border-gray-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <th className="px-6 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider w-16 bg-[#f5f6fa]">S.N</th>
              <th className="px-6 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider bg-[#f5f6fa]">Category Name</th>
              <th className="px-6 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider bg-[#f5f6fa]">Status</th>
              <th className="px-3 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider text-right bg-[#f5f6fa]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 animate-in fade-in duration-300">
                    {isSearching ? (
                      <>
                        <SearchX size={32} className="text-rose-300" />
                        <span className="text-sm font-bold text-[#364a63]">No matching categories found.</span>
                        <p className="text-[11px] text-gray-400">Try adjusting your search terms.</p>
                      </>
                    ) : (
                      <>
                        <Inbox size={32} className="text-gray-200" />
                        <span className="text-sm font-bold text-[#364a63]">Not Found Category</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-2">
                    <span className="text-sm font-medium text-[#526484]">{index + 1}.</span>
                  </td>
                  <td className="px-6 py-2">
                    <span className="text-sm font-bold text-[#364a63]">{item.name}</span>
                  </td>
                  <td className="px-6 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      item.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-red-500"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 text-blue-500 hover:text-blue-600 active:scale-90 transition-transform">
                        <Pencil size={12} />
                      </button>
                      <button className="p-1.5 text-red-500 hover:text-rose-600 active:scale-90 transition-transform">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
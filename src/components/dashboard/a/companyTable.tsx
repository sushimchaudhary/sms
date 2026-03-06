"use client";

import React from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  EditIcon,
  Pencil,
} from "lucide-react";

const CompanyTable = () => {
  // Sample JSON data
  const companys = [
    {
      id: "#1",
      name: "text",
      email: "text@gmail.com",
      address: "New Road, Kathmandu",
      phone: "+977-9800000000",
      pan: "601234567",
    },
    
  ];

  return (
    <>
      {/* Table Container */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f6fa] border-b border-gray-200">
                <th className="px-6 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider">
                  company
                </th>
                <th className="px-6 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider">
                  PAN Number
                </th>
                <th className="px-3 py-1.5 text-[12px] font-bold text-[#8094ae] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companys.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Org Name & Address */}
                  <td className="px-6 py-1.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#364a63]">
                        {org.name}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#8094ae] mt-1">
                        <MapPin size={10} />
                        <span>{org.address}</span>
                      </div>
                    </div>
                  </td>

                  {/* Email & Phone */}
                  <td className="px-6 py-1.5">
                    <div className="flex flex-col">
                      <span className="text-sm text-[#526484]">
                        {org.email}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#8094ae] mt-1">
                        <Phone size={10} />
                        <span>{org.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* PAN Number */}
                  <td className="px-6 py-1.5">
                    <span className="text-sm font-medium text-[#526484] bg-gray-100 px-2 py-1 rounded text-xs">
                      {org.pan}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Edit"
                        className="p-1.5 text-blue-500 hover:text-blue-600 transition-all duration-200 active:scale-90"
                      >
                        <Pencil size={12}  />
                      </button>

                      <button
                        title="Delete"
                        className="p-1.5 text-red-500 hover:text-rose-600  transition-all duration-200 active:scale-90"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CompanyTable;

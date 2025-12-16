"use client";

import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

export default function PasswordInput({
  password,
  setPassword,
}: {
  password: string;
  setPassword: (v: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-5">
      <label className="text-sm">Mật khẩu</label>
      <div className="relative group">
        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Nhập mật khẩu"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

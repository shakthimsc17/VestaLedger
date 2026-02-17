"use client";
import { useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEsc);
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxWidth: '500px' }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24
                }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                        style={{ padding: 4, color: 'var(--text-muted)' }}
                    >
                        <HiOutlineXMark size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

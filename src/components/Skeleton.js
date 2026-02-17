export const Skeleton = ({ width, height, borderRadius, className = "" }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: width || "100%",
                height: height || "20px",
                borderRadius: borderRadius || "var(--radius-sm)",
            }}
        />
    );
};

export const CardSkeleton = () => {
    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <Skeleton width="48px" height="48px" borderRadius="12px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton width="60%" height="20px" />
                    <Skeleton width="40%" height="14px" />
                </div>
            </div>
            <Skeleton width="100%" height="40px" borderRadius="8px" />
        </div>
    );
};

export const TableRowSkeleton = () => {
    return (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '16px 20px' }}><Skeleton width="80px" height="16px" /></td>
            <td style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Skeleton width="24px" height="24px" borderRadius="50%" />
                    <Skeleton width="100px" height="16px" />
                </div>
            </td>
            <td style={{ padding: '16px 20px' }}><Skeleton width="150px" height="16px" /></td>
            <td style={{ padding: '16px 20px' }}><Skeleton width="60px" height="16px" style={{ marginLeft: 'auto' }} /></td>
            <td style={{ padding: '16px 20px' }}><Skeleton width="40px" height="32px" style={{ marginLeft: 'auto' }} /></td>
        </tr>
    );
};

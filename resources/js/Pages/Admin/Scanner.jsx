import { AdminShell } from '@/layouts/AdminShell';
import ScannerContent from '@/features/scanner/Page';

export default function ScannerPage(props) {
    return (
        <AdminShell fullBleed>
            <ScannerContent {...props} />
        </AdminShell>
    );
}

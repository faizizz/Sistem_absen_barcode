import { router } from '@inertiajs/react';
import { toast } from './toast';

let installed = false;

export function installFlashBridge() {
    if (installed) return;
    installed = true;

    router.on('success', (event) => {
        const props = event.detail?.page?.props || {};
        const flash = props.flash || {};
        if (flash.success) toast.success(flash.success);
        if (flash.info) toast.info(flash.info);
        if (flash.error) toast.error(flash.error);
    });

    router.on('error', (event) => {
        const errors = event.detail?.errors || {};
        const first = Object.values(errors).find(Boolean);
        if (first) toast.error(typeof first === 'string' ? first : String(first));
    });
}

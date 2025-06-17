<script>
    import './app.css';

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    import { Router, Route, link } from 'svelte-routing';

    export let url = '';

    import { Toaster } from 'svelte-sonner';
    import BankTransfers from './routes/BankTransfers.svelte';
    import DigitalAssets from './routes/DigitalAssets.svelte';
    import Frontpage from './routes/Frontpage.svelte';
    import Register from './components/register/Register.svelte';
    import ResetPassword from './routes/ResetPassword.svelte';
    import Logout from './components/logout/Logout.svelte';
    import AccountDashboard from './routes/AccountDashboard.svelte';
    import AccountSettings from './routes/AccountSettings.svelte';
    import TradingForm from './routes/TradingForm.svelte';
    import authStore from './store/authStore';

    import * as NavigationMenu from '$lib/components/ui/navigation-menu';
    import { buttonVariants } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
</script>

<Router {url}>
    <Toaster />
    {#if !$authStore.isAuthenticated}
        <Route path="/"><Frontpage /></Route>
        <Route path="/register"><Register /></Route>
        <Route path="/forgot-password"><ResetPassword /></Route>
    {/if}

    {#if $authStore.isAuthenticated}
        <NavigationMenu.Root class="flex justify-center p-4">
            <NavigationMenu.List class="flex items-center space-x-2">
                <NavigationMenu.Item>
                    <a href="/dashboard" use:link class={buttonVariants({ variant: 'ghost' })}
                        >Account</a
                    >
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>Settings</DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Group>
                                <DropdownMenu.Label>Manage Account</DropdownMenu.Label>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item>
                                    <a href="/bank-transfers" use:link>Bank Transfers</a>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item>
                                    <a href="/digital-assets" use:link>Digital Assets</a>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item>Profile Settings</DropdownMenu.Item>
                            </DropdownMenu.Group>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <a href="/trading" use:link class={buttonVariants({ variant: 'ghost' })}
                        >Trade</a
                    >
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <Logout />
                </NavigationMenu.Item>
            </NavigationMenu.List>
        </NavigationMenu.Root>

        <Route path="/dashboard">
            <AccountDashboard />
        </Route>

        <Route path="/trading">
            <TradingForm />
        </Route>

        <Route path="/settings">
            <AccountSettings />
        </Route>

        <Route path="/bank-transfers">
            <BankTransfers />
        </Route>

        <Route path="/digital-assets">
            <DigitalAssets />
        </Route>
    {/if}
</Router>

#!/usr/bin/env python3
"""
HatchOS Admin GUI

Simple Tkinter GUI that authenticates against the local `server.py` (POST /api/auth/login).
Only users with role 'teacher' are allowed to proceed. The GUI lists devices from the server
and attempts to connect to devices' wireless ADB endpoints (ip:5555) where available. It shows
device info, attempts to fetch MAC address via adb shell, allows renaming a device (calls
PUT /api/devices/<id>/rename), and can upload/install an APK to a selected device using adb.

Prereqs: Python 3.8+, requests installed, adb available in PATH, server running and accessible.
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import requests
from requests.exceptions import RequestException, ConnectTimeout, ConnectionError, SSLError
import urllib3
import json
from tkinter import simpledialog
import subprocess
import shutil
import threading
import os
import re
import sys
import time


class HatchOSAdminApp:
    def install_apk_multi_dialog(self):
        # Step 1: Select APK file
        apk = filedialog.askopenfilename(title='Select APK', filetypes=[('APK files','*.apk')])
        if not apk:
            return

        # Step 2: Show device selection window
        devs = []
        for iid in self.tree.get_children():
            vals = self.tree.item(iid, 'values')
            serial = vals[2] if len(vals) > 2 else ''
            name = vals[0]
            status = vals[4] if len(vals) > 4 else ''
            if serial and status.lower() == 'online':
                devs.append({'serial': serial, 'name': name})
        if not devs:
            messagebox.showinfo('No devices', 'No online devices found.')
            return

        sel_win = tk.Toplevel(self.root)
        sel_win.title('Select Devices for APK Install')
        sel_win.geometry('400x400')
        ttk.Label(sel_win, text=f'Select devices to install {os.path.basename(apk)}:').pack(pady=8)

        checks = []
        frm = ttk.Frame(sel_win)
        frm.pack(fill='both', expand=True)
        for dev in devs:
            var = tk.BooleanVar(value=True)
            cb = ttk.Checkbutton(frm, text=f"{dev['name']} ({dev['serial']})", variable=var)
            cb.pack(anchor='w', padx=12, pady=2)
            checks.append((dev, var))

        def do_install():
            selected = [dev['serial'] for dev, var in checks if var.get()]
            if not selected:
                messagebox.showinfo('Select device(s)', 'Please select at least one device.')
                return
            sel_win.destroy()
            self._show_install_progress(selected, apk)

        ttk.Button(sel_win, text='Install', command=do_install).pack(pady=10)
        ttk.Button(sel_win, text='Cancel', command=sel_win.destroy).pack()

    def _show_install_progress(self, serials, apk_path):
        # Progress popup
        prog_win = tk.Toplevel(self.root)
        prog_win.title('Installing APK...')
        prog_win.geometry('600x400')
        ttk.Label(prog_win, text=f'Installing {os.path.basename(apk_path)}').pack(pady=8)
        txt = tk.Text(prog_win, height=18, width=80, state='normal')
        txt.pack(fill='both', expand=True, padx=8, pady=8)
        txt.insert('end', 'Starting install...\n')
        txt.configure(state='disabled')

        def log(msg):
            txt.configure(state='normal')
            txt.insert('end', msg + '\n')
            txt.see('end')
            txt.configure(state='disabled')
            prog_win.update_idletasks()

        def do_install():
            for serial in serials:
                log(f'Installing to {serial}...')
                try:
                    p = subprocess.run(['adb','-s',serial,'install','-r',apk_path], capture_output=True, text=True, timeout=120)
                    out = (p.stdout or '') + '\n' + (p.stderr or '')
                    if 'success' in out.lower():
                        log(f'{serial}: Success')
                    else:
                        log(f'{serial}: Failed\n{out}')
                except Exception as e:
                    log(f'{serial}: Error {e}')
            log('Install complete.')
            ttk.Button(prog_win, text='Close', command=prog_win.destroy).pack(pady=8)

        threading.Thread(target=do_install, daemon=True).start()
    def __init__(self, root):
        self.root = root
        self.root.title('HatchOS Admin')

        self.server_url = tk.StringVar(value='http://127.0.0.1:5000')
        self.email = tk.StringVar()
        self.password = tk.StringVar()
        self.user = None
        self.saved_devices = {}  # local saved metadata keyed by adb serial
        self.show_adb_only = tk.BooleanVar(value=False)

        # load any locally saved device metadata, then build the login UI
        self.load_saved_devices()

        self._build_login()

    def _build_login(self):
        frm = ttk.Frame(self.root, padding=12)
        frm.grid(row=0, column=0, sticky='nsew')

        ttk.Label(frm, text='Server URL').grid(row=0, column=0, sticky='w')
        ttk.Entry(frm, textvariable=self.server_url, width=40).grid(row=0, column=1, columnspan=2)

        ttk.Label(frm, text='Email').grid(row=1, column=0, sticky='w')
        ttk.Entry(frm, textvariable=self.email, width=40).grid(row=1, column=1, columnspan=2)

        ttk.Label(frm, text='Password').grid(row=2, column=0, sticky='w')
        ttk.Entry(frm, textvariable=self.password, show='*', width=40).grid(row=2, column=1, columnspan=2)

        self.login_btn = ttk.Button(frm, text='Login', command=self.login)
        self.login_btn.grid(row=3, column=1, sticky='e')
        ttk.Button(frm, text='Quit', command=self.root.quit).grid(row=3, column=2, sticky='w')

        self.status_label = ttk.Label(frm, text='Enter teacher credentials to continue', foreground='blue')
        self.status_label.grid(row=4, column=0, columnspan=3, pady=(8,0))

    def login(self):
        base = self.server_url.get().rstrip('/')
        url = base + '/api/auth/login'
        payload = {'email': self.email.get().strip(), 'password': self.password.get()}
        self.status('Logging in...')
        try:
            r = requests.post(url, json=payload, timeout=8)
        except Exception as e:
            messagebox.showerror('Error', f'Failed to contact server: {e}')
            self.status('Server unreachable')
            return

        if r.status_code != 200:
            messagebox.showerror('Login failed', f'Login failed: {r.text}')
            self.status('Login failed')
            return

        data = r.json()
        user = data.get('user')
        if not user:
            messagebox.showerror('Login failed', 'No user object returned')
            return

        if user.get('role') != 'teacher':
            messagebox.showwarning('Access restricted', 'Account restricted: contact admin to see group policy')
            self.status('Access restricted')
            return

        self.user = user
        self.status(f"Logged in as {user.get('name')}")
        # destroy login widgets and build main UI
        for w in self.root.winfo_children():
            w.destroy()
        self._build_main()


    def _build_main(self):
        top = ttk.Frame(self.root, padding=8)
        top.pack(fill='x')

        ttk.Label(top, text=f"Server: {self.server_url.get()}").pack(side='left')
        ttk.Label(top, text=f"User: {self.user.get('name')} ({self.user.get('email')})").pack(side='left', padx=12)

        btn_frame = ttk.Frame(self.root, padding=6)
        btn_frame.pack(fill='x')
        # Toolbar: Refresh and Install APK
        ttk.Button(btn_frame, text='Refresh', command=self.refresh_all).pack(side='left')
        ttk.Button(btn_frame, text='Install APK', command=self.install_apk_multi_dialog).pack(side='left', padx=8)

        # Device list (Treeview)
        cols = ('deviceName','mac','serial','model','status')
        self.tree = ttk.Treeview(self.root, columns=cols, show='headings', selectmode='extended')
        self.tree.heading('deviceName', text='Name')
        self.tree.heading('mac', text='MAC')
        self.tree.heading('serial', text='ADB Serial')
        self.tree.heading('model', text='Model')
        self.tree.heading('status', text='Status')
        self.tree.pack(fill='both', expand=True, padx=8, pady=6)
        self.tree.bind('<Double-1>', self.on_device_double)

        # Bottom status bar (minimal)
        bottom = ttk.Frame(self.root, padding=8)
        bottom.pack(fill='x')
        self.status_label = ttk.Label(bottom, text='Ready')
        self.status_label.pack(side='right')

        # internal state
        self.devices = []  # list from server
        self.adb_map = {}  # serial -> info

        # initial load (optional: auto-refresh devices)
        # self.refresh_devices()
        # self.refresh_adb_list()
    def install_apk_multi_dialog(self):
        # Select APK file
        apk = filedialog.askopenfilename(title='Select APK', filetypes=[('APK files','*.apk')])
        if not apk:
            return
        # Get selected devices (multi-select)
        sels = self.tree.selection()
        if not sels:
            messagebox.showinfo('Select device(s)', 'Please select one or more devices to install the APK.')
            return
        serials = []
        for sel in sels:
            vals = self.tree.item(sel, 'values')
            serial = vals[2] if len(vals) > 2 else ''
            if serial:
                serials.append(serial)
        if not serials:
            messagebox.showinfo('No ADB serials', 'No valid ADB serials found for selected devices.')
            return
        # Confirm
        if not messagebox.askyesno('Confirm', f'Install {os.path.basename(apk)} to {len(serials)} device(s)?'):
            return
        # Run install in background
        threading.Thread(target=self._install_apk_multi, args=(serials, apk), daemon=True).start()

    def _install_apk_multi(self, serials, apk_path):
        results = []
        for serial in serials:
            self.status(f'Installing {os.path.basename(apk_path)} to {serial} ...')
            try:
                p = subprocess.run(['adb','-s',serial,'install','-r',apk_path], capture_output=True, text=True, timeout=120)
                out = p.stdout + '\n' + p.stderr
                if 'success' in out.lower():
                    results.append(f'{serial}: Success')
                else:
                    results.append(f'{serial}: Failed\n{out}')
            except Exception as e:
                results.append(f'{serial}: Error {e}')
        self.status('Install complete')
        messagebox.showinfo('Install Results', '\n\n'.join(results))

        # Device list
        # Columns: Name, MAC, ADB Serial, Model, Status (realtime)
        cols = ('deviceName','mac','serial','model','status')
        self.tree = ttk.Treeview(self.root, columns=cols, show='headings')
        self.tree.heading('deviceName', text='Name')
        self.tree.heading('mac', text='MAC')
        self.tree.heading('serial', text='ADB Serial')
        self.tree.heading('model', text='Model')
        self.tree.heading('status', text='Status')
        self.tree.pack(fill='both', expand=True, padx=8, pady=6)

        self.tree.bind('<Double-1>', self.on_device_double)

        # Bottom status bar (minimal)
        bottom = ttk.Frame(self.root, padding=8)
        bottom.pack(fill='x')
        self.status_label = ttk.Label(bottom, text='Ready')
        self.status_label.pack(side='right')

        # internal state
        self.devices = []  # list from server
        self.adb_map = {}  # serial -> info

        # initial load
        self.refresh_devices()
        self.refresh_adb_list()

    def status(self, text):
        try:
            self.status_label.config(text=text)
        except Exception:
            pass

    def refresh_devices(self):
        url = self.server_url.get().rstrip('/') + '/api/devices'
        try:
            r = requests.get(url, timeout=8)
            if r.status_code == 200:
                data = r.json()
                self.devices = data.get('devices', [])
                self._populate_tree()
                self.status(f'Loaded {len(self.devices)} devices from server')
            else:
                messagebox.showerror('Error', f'Failed to fetch devices: {r.text}')
                self.status('Failed to load devices')
        except Exception as e:
            messagebox.showerror('Error', f'Failed to contact server: {e}')
            self.status('Server unreachable')

    def _populate_tree(self):
        for r in self.tree.get_children():
            self.tree.delete(r)
        # Build base rows from server devices
        for d in self.devices:
            # For server-backed devices we show name, known MAC (if any), blank serial (adb will fill), model, and Offline/Online later
            name = d.get('device_name','')
            saved = None
            # find if any saved device maps to this server device by server id
            for sdev_serial, sdev in self.saved_devices.items():
                if sdev.get('server_id') and str(sdev.get('server_id')) == str(d.get('_id')):
                    saved = sdev
                    break
            display_name = saved.get('display_name') if saved else name
            # attempt to read MAC from server deviceInfo (common keys)
            mac = d.get('deviceInfo', {}).get('mac') or d.get('deviceInfo', {}).get('macAddress','') or ''
            model = d.get('deviceInfo', {}).get('model','')
            # serial unknown at this point; status will be updated by refresh_adb_list when matching
            self.tree.insert('', 'end', values=(display_name or name, mac, '', model, 'Offline'))

        # If show_adb_only is True, skip adding server rows and refresh adb-only list instead
        if self.show_adb_only.get():
            # refresh_adb_list will insert adb-connected devices (including adb-only mdns/tls entries)
            self.refresh_adb_list()
            return

    def connect_wireless_thread(self):
        threading.Thread(target=self.connect_wireless_adb, daemon=True).start()

    def detect_adb(self):
        """Return adb executable path and basic version info."""
        adb_path = shutil.which('adb')
        version = ''
        devices_out = ''
        try:
            if adb_path:
                p = subprocess.run([adb_path, '--version'], capture_output=True, text=True, timeout=6)
                version = p.stdout.strip() or p.stderr.strip()
            # get current devices list
            p2 = subprocess.run(['adb','devices','-l'], capture_output=True, text=True, timeout=6)
            devices_out = p2.stdout.strip() or p2.stderr.strip()
        except Exception as e:
            version = version + f"\nError running adb: {e}"
        return adb_path, version, devices_out

    def show_diagnostics(self):
        adb_path, version, devices_out = self.detect_adb()
        top = tk.Toplevel(self.root)
        top.title('ADB Diagnostics')
        top.geometry('700x400')

        frm = ttk.Frame(top, padding=8)
        frm.pack(fill='both', expand=True)

        ttk.Label(frm, text=f'ADB path: {adb_path or "Not found in PATH"}').pack(anchor='w')
        ttk.Label(frm, text='ADB --version output:').pack(anchor='w', pady=(8,0))
        txt = tk.Text(frm, wrap='none', height=6)
        txt.insert('1.0', version)
        txt.configure(state='disabled')
        txt.pack(fill='x')

        ttk.Label(frm, text='adb devices -l output:').pack(anchor='w', pady=(8,0))
        txt2 = tk.Text(frm, wrap='none')
        txt2.insert('1.0', devices_out)
        txt2.configure(state='disabled')
        txt2.pack(fill='both', expand=True)

        ttk.Button(frm, text='Close', command=top.destroy).pack(pady=6)

    def pair_adb_dialog(self):
        """Prompt for pairing IP:port and pairing code, then attempt adb pair and adb connect."""
        top = tk.Toplevel(self.root)
        top.title('Pair ADB')
        top.geometry('420x200')

        frm = ttk.Frame(top, padding=8)
        frm.pack(fill='both', expand=True)

        ttk.Label(frm, text='Pairing IP:port (from device pairing UI)').pack(anchor='w')
        pair_addr_var = tk.StringVar()
        ttk.Entry(frm, textvariable=pair_addr_var, width=40).pack(pady=4)

        ttk.Label(frm, text='Pairing code (shown on device)').pack(anchor='w')
        code_var = tk.StringVar()
        ttk.Entry(frm, textvariable=code_var, width=20).pack(pady=4)

        ttk.Label(frm, text='Connection IP:port (optional, usually ip:5555)').pack(anchor='w')
        conn_var = tk.StringVar()
        ttk.Entry(frm, textvariable=conn_var, width=40).pack(pady=4)

        def on_pair():
            pair_addr = pair_addr_var.get().strip()
            code = code_var.get().strip()
            conn_addr = conn_var.get().strip() or pair_addr
            if not pair_addr or not code:
                messagebox.showinfo('Input required', 'Please enter pairing address and code')
                return
            top.destroy()
            threading.Thread(target=self.pair_and_connect, args=(pair_addr, code, conn_addr), daemon=True).start()

        btns = ttk.Frame(frm)
        btns.pack(fill='x', pady=6)
        ttk.Button(btns, text='Pair & Connect', command=on_pair).pack(side='left')
        ttk.Button(btns, text='Cancel', command=top.destroy).pack(side='right')

    def pair_and_connect(self, pair_addr, code, conn_addr):
        self.status(f'Pairing {pair_addr} ...')
        try:
            # adb pair expects code on stdin
            p = subprocess.run(['adb','pair', pair_addr], input=code + '\n', capture_output=True, text=True, timeout=30)
            out = (p.stdout or '') + '\n' + (p.stderr or '')
            success = False
            if 'Successfully paired' in out or 'Pairing successful' in out or 'Successfully paired to' in out:
                success = True

            if not success:
                # show output and abort
                messagebox.showerror('Pair failed', f'adb pair output:\n{out}')
                self.status('Pair failed')
                return

            self.status(f'Pair succeeded, connecting to {conn_addr}...')
            p2 = subprocess.run(['adb','connect', conn_addr], capture_output=True, text=True, timeout=15)
            out2 = (p2.stdout or '') + '\n' + (p2.stderr or '')
            if 'connected' in out2.lower() or 'already' in out2.lower():
                messagebox.showinfo('Connected', f'Connected: {out2}')
                self.status('Connected')
            else:
                messagebox.showwarning('Connect result', f'adb connect output:\n{out2}')
                self.status('Connect may have failed')

            # Refresh adb list after pairing/connect attempt
            time.sleep(1)
            self.refresh_adb_list()
        except subprocess.TimeoutExpired:
            messagebox.showerror('Timeout', 'adb pair/connect timed out')
            self.status('Pair/connect timeout')
        except Exception as e:
            messagebox.showerror('Error', f'Pair/connect failed: {e}')
            self.status('Pair/connect failed')

    def connect_wireless_adb(self):
        self.status('Connecting to devices via wireless ADB...')
        any_connected = 0
        for d in self.devices:
            ip = d.get('deviceInfo', {}).get('ipAddress')
            if not ip:
                continue
            target = f"{ip}:5555"
            try:
                p = subprocess.run(['adb','connect', target], capture_output=True, text=True, timeout=12)
                out = p.stdout.strip() + '\n' + p.stderr.strip()
                if 'connected' in out.lower() or 'already' in out.lower():
                    any_connected += 1
            except Exception as e:
                print('adb connect failed', e)
        self.status(f'Wireless connect done. {any_connected} connection attempts OK')
        # refresh adb list
        self.refresh_adb_list()

    def refresh_adb_list(self):
        try:
            p = subprocess.run(['adb','devices','-l'], capture_output=True, text=True, timeout=8)
            out = p.stdout.strip()
            lines = out.splitlines()[1:]
            self.adb_map = {}
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                serial = parts[0]
                info = {'serial': serial}
                # parse key:value tokens
                for token in parts[1:]:
                    if ':' in token:
                        k,v = token.split(':',1)
                        info[k] = v
                self.adb_map[serial] = info

            # Show only currently connected adb devices
            # Clear existing rows
            for r in self.tree.get_children():
                self.tree.delete(r)


            for serial, info in self.adb_map.items():
                # Determine IP and model
                ip_guess = ''
                if ':' in serial and serial.count(':') == 1:
                    ip_guess = serial.split(':')[0]

                saved = self.saved_devices.get(serial) or self.saved_devices.get(f'server-{serial}')
                display_name = saved.get('display_name') if saved else (info.get('model') or info.get('device') or serial)

                # Try to match this adb device to a server device by IP (best effort)
                device_id = ''
                server_ip = ''
                for d in self.devices:
                    try:
                        dip = d.get('deviceInfo', {}).get('ipAddress', '')
                    except Exception:
                        dip = ''
                    if dip and ip_guess and str(dip) == str(ip_guess):
                        device_id = str(d.get('_id',''))
                        server_ip = dip
                        # prefer server name if not overridden by saved display
                        if not saved:
                            display_name = d.get('device_name') or display_name
                        break

                # get mac and model via adb (may be slow)
                mac = ''
                model = info.get('model') or info.get('device') or ''
                try:
                    mac = self.get_mac_for_serial(serial)
                except Exception:
                    mac = ''

                status = 'Online'
                # Insert row as (Name, MAC, Serial, Model, Status)
                self.tree.insert('', 'end', values=(display_name, mac, serial, model, status))

            self.status(f'Found {len(self.adb_map)} adb devices (online)')
        except Exception as e:
            messagebox.showerror('Error', f'Failed to run adb: {e}')
            self.status('adb failed')
            return

    def refresh_all(self):
        """Refresh server device list and adb-connected devices."""
        def do_refresh():
            try:
                self.status('Refreshing server devices...')
                # refresh server list but don't block UI (network call may take time)
                try:
                    self.refresh_devices()
                except Exception:
                    pass
                self.status('Refreshing adb devices...')
                self.refresh_adb_list()
                self.status('Refresh complete')
            except Exception as e:
                self.status(f'Refresh failed: {e}')

        threading.Thread(target=do_refresh, daemon=True).start()

    def on_device_double(self, event):
        self.refresh_selected_info()

    def get_selected(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo('Select device', 'Please select a device first')
            return None, None
        vals = self.tree.item(sel[0],'values')
        # New columns: (Name, MAC, Serial, Model, Status)
        serial = vals[2] if len(vals) > 2 else ''
        mac = vals[1] if len(vals) > 1 else ''
        # try to find server device by MAC or by IP matching serial prefix
        dev = None
        for d in self.devices:
            try:
                dip = d.get('deviceInfo', {}).get('ipAddress','')
            except Exception:
                dip = ''
            dmac = d.get('deviceInfo', {}).get('mac') or d.get('deviceInfo', {}).get('macAddress','') or ''
            if dmac and mac and str(dmac).lower() == str(mac).lower():
                dev = d
                break
            if dip and serial and str(serial).startswith(str(dip)):
                dev = d
                break
        return dev, vals

    def refresh_selected_info(self):
        dev, vals = self.get_selected()
        if not dev:
            return
        # New columns: (Name, MAC, Serial, Model, Status)
        serial = vals[2]
        if not serial:
            # try find serial by matching any adb serial that starts with a known IP from the server device
            ip = dev.get('deviceInfo',{}).get('ipAddress','')
            for s,i in self.adb_map.items():
                if ip and s.startswith(ip):
                    serial = s
                    break

        mac = ''
        model = ''
        if serial:
            mac = self.get_mac_for_serial(serial)
            model = self.get_model_for_serial(serial)

        # update tree row (keep server name)
        sel = self.tree.selection()[0]
        display_name = dev.get('device_name','')
        newvals = (display_name, mac or dev.get('deviceInfo',{}).get('mac','') or dev.get('deviceInfo',{}).get('macAddress',''), serial or '', model or dev.get('deviceInfo',{}).get('model',''), 'Online' if serial else 'Offline')
        self.tree.item(sel, values=newvals)
        self.status('Device info refreshed')

    def get_model_for_serial(self, serial):
        try:
            p = subprocess.run(['adb','-s',serial,'shell','getprop','ro.product.model'], capture_output=True, text=True, timeout=6)
            return p.stdout.strip()
        except Exception:
            return ''

    def get_mac_for_serial(self, serial):
        try:
            # Try wlan0
            p = subprocess.run(['adb','-s',serial,'shell','ip','addr','show','wlan0'], capture_output=True, text=True, timeout=6)
            out = p.stdout or p.stderr or ''
            m = re.search(r'link/ether\s+([0-9a-f:]{17})', out, re.IGNORECASE)
            if m:
                return m.group(1)
            # fallback to eth0
            p = subprocess.run(['adb','-s',serial,'shell','ip','addr','show','eth0'], capture_output=True, text=True, timeout=6)
            out = p.stdout or p.stderr or ''
            m = re.search(r'link/ether\s+([0-9a-f:]{17})', out, re.IGNORECASE)
            if m:
                return m.group(1)
        except Exception as e:
            print('get_mac failed', e)
        return ''

    def rename_device_dialog(self):
        dev, vals = self.get_selected()
        if not dev:
            return

        def do_rename():
            newname = entry.get().strip()
            if not newname:
                messagebox.showinfo('Input required', 'Please enter a name')
                return
            self.rename_device_on_server(dev.get('_id'), newname)
            top.destroy()

        top = tk.Toplevel(self.root)
        top.title('Rename Device')
        ttk.Label(top, text='New device name:').pack(padx=8, pady=6)
        entry = ttk.Entry(top, width=40)
        entry.insert(0, dev.get('device_name',''))
        entry.pack(padx=8, pady=6)
        ttk.Button(top, text='Rename', command=do_rename).pack(pady=6)

    def rename_device_on_server(self, device_id, new_name):
        url = self.server_url.get().rstrip('/') + f'/api/devices/{device_id}/rename'
        try:
            r = requests.put(url, json={'deviceName': new_name}, timeout=8)
            if r.status_code == 200:
                messagebox.showinfo('Success', 'Device renamed on server')
                # refresh device list
                self.refresh_devices()
            else:
                messagebox.showerror('Error', f'Failed to rename device: {r.text}')
        except Exception as e:
            messagebox.showerror('Error', f'Failed to contact server: {e}')

    def install_apk_dialog(self):
        dev, vals = self.get_selected()
        if not dev:
            return
        # adjusted column order: serial is at index 2
        serial = vals[2]
        if not serial:
            messagebox.showinfo('Select device', 'Selected device is not connected by adb')
            return

        apk = filedialog.askopenfilename(title='Select APK', filetypes=[('APK files','*.apk')])
        if not apk:
            return

        threading.Thread(target=self.install_apk, args=(serial, apk), daemon=True).start()

    def install_apk(self, serial, apk_path):
        self.status(f'Installing {os.path.basename(apk_path)} to {serial} ...')
        try:
            p = subprocess.run(['adb','-s',serial,'install','-r',apk_path], capture_output=True, text=True, timeout=120)
            out = p.stdout + '\n' + p.stderr
            if 'success' in out.lower():
                messagebox.showinfo('Installed', f'APK installed successfully on {serial}')
            else:
                messagebox.showerror('Install failed', out)
        except Exception as e:
            messagebox.showerror('Error', f'ADB install failed: {e}')
        finally:
            self.status('Ready')

    def load_saved_devices(self):
        """Load saved device metadata from disk into self.saved_devices."""
        try:
            base = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(base, 'saved_devices.json')
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self.saved_devices = data
                    else:
                        # Older formats or lists -> convert
                        self.saved_devices = {k: v for k, v in (data.items() if isinstance(data, dict) else [])}
            else:
                self.saved_devices = {}
        except Exception as e:
            print('Failed to load saved_devices.json:', e)
            self.saved_devices = {}

    def save_selected_device_locally(self):
        """Save the currently selected device's metadata to saved_devices.json."""
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo('Select device', 'Please select a device first')
            return
        vals = list(self.tree.item(sel[0], 'values'))
        # vals = (deviceName, _id, ip, mac, serial, model, status)
        display_name = simpledialog.askstring('Display name', 'Enter display name for this device', initialvalue=vals[0] or '')
        if display_name is None:
            return

        serial = vals[2] or ''
        mac = vals[1] or ''
        # try to find server id by matching MAC or serial
        server_id = ''
        for d in self.devices:
            dmac = d.get('deviceInfo', {}).get('mac') or d.get('deviceInfo', {}).get('macAddress','') or ''
            dip = d.get('deviceInfo', {}).get('ipAddress','')
            if dmac and mac and str(dmac).lower() == str(mac).lower():
                server_id = str(d.get('_id',''))
                break
            if dip and serial and str(serial).startswith(str(dip)):
                server_id = str(d.get('_id',''))
                break

        record = {
            'display_name': display_name,
            'serial': serial,
            'server_id': server_id,
            'ip': '',
            'model': vals[3] or '',
            'mac': mac or ''
        }

        key = serial if serial else f'server-{server_id}'
        self.saved_devices[key] = record

        # persist to disk
        try:
            base = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(base, 'saved_devices.json')
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(self.saved_devices, f, indent=2, ensure_ascii=False)
            messagebox.showinfo('Saved', f'Device saved locally to {path}')
        except Exception as e:
            messagebox.showerror('Error', f'Failed to save device locally: {e}')
            return

        # Update UI display
        # If we saved by serial, find any tree row with that serial and update its name
        for iid in self.tree.get_children():
            row = list(self.tree.item(iid, 'values'))
            # row layout: (Name, MAC, Serial, Model, Status)
            if serial and len(row) > 2 and row[2] == serial:
                row[0] = display_name
                self.tree.item(iid, values=row)
            # if saved by server id (no serial), try match by MAC
            if not serial and server_id and mac and len(row) > 1 and row[1] == mac:
                row[0] = display_name
                self.tree.item(iid, values=row)


def main():
    root = tk.Tk()
    app = HatchOSAdminApp(root)
    root.geometry('900x600')
    root.mainloop()


if __name__ == '__main__':
    main()

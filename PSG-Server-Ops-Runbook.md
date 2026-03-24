# PSG Server Operations Runbook

Last updated: 2026-03-24
Owner: Nick Schoolcraft, Phoenix Solutions Group

This is a repeatable checklist. Run through each section at its cadence. Mark items complete as you go, then reset the checkboxes at the start of each new cycle.

---

## Server Quick Reference

| Alias | IP | SSH Command | Role |
|-------|-----|-------------|------|
| proxmox | 162.55.102.87 | `ssh root@162.55.102.87` | Hypervisor, bare metal |
| cpanel | 144.76.216.70 | `ssh -p 2222 root@144.76.216.70` | Web hosting, email |
| docker | 5.161.189.118 | `ssh root@5.161.189.118` | n8n, containers, staging |
| apps | 128.140.81.55 | `ssh root@128.140.81.55` | App hosting |
| paperclip | 128.140.87.0 | `ssh root@128.140.87.0` | Paperclip.ai |

Web UIs:
- Proxmox: https://162.55.102.87:8006
- WHM: https://144.76.216.70:2087
- Portainer: https://portainer.psgweb.me
- n8n: https://n8n.psgweb.me
- Uptime Kuma: https://uptime.psgweb.me (verify actual URL)

---

## DAILY (5 minutes)

Goal: Catch anything that broke overnight.

### 1. Check Uptime Kuma Dashboard

- [ ] Open Uptime Kuma and scan for any red/yellow alerts
- [ ] If any monitor is down, investigate immediately (skip to the relevant server below)

### 2. Glance at Docker Server Disk

This is your most at-risk server (86% disk as of March 2026). A full disk takes down all containers.

```bash
ssh root@5.161.189.118 'df -h / /mnt/HC_Volume_104873979 && echo "---" && docker ps --format "table {{.Names}}\t{{.Status}}" | head -20'
```

What you are looking for:
- Root disk (/) stays below 85%. If above 85%, run cleanup (see Weekly section).
- All expected containers show "Up" status.

### 3. Check n8n Workflow Failures (if applicable)

```bash
ssh root@5.161.189.118 'docker logs n8n --since 24h 2>&1 | grep -i "error\|fail" | tail -10'
```

If you see repeated errors, open n8n at https://n8n.psgweb.me and check the execution log for the affected workflow.

### 4. Quick cPanel Health Check

```bash
ssh -p 2222 root@144.76.216.70 'uptime && free -h | head -2 && /usr/local/cpanel/bin/whmapi1 systemloadavg --output=jsonpretty 2>/dev/null | grep -A3 "one\|five\|fifteen" || echo "load check done"'
```

What you are looking for:
- Load average below 4.0 (server has 16 vCPUs).
- Swap usage not climbing above 6 GB (currently around 4.9 GB). If swap grows steadily, a process is leaking memory.

---

## WEEKLY (30 minutes, every Monday)

Goal: Clean up, verify backups, catch slow-building problems.

### 1. Docker Server Cleanup

```bash
ssh root@5.161.189.118 << 'EOF'
echo "=== DISK BEFORE ==="
df -h /

echo "=== REMOVING STOPPED CONTAINERS ==="
docker container prune -f

echo "=== REMOVING DANGLING IMAGES ==="
docker image prune -f

echo "=== REMOVING UNUSED NETWORKS ==="
docker network prune -f

echo "=== DISK AFTER ==="
df -h /

echo "=== CONTAINER STATUS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"
EOF
```

- [ ] Root disk usage dropped or held steady
- [ ] All containers still running after prune
- [ ] No containers with "Restarting" status

If disk is still above 85% after prune:
```bash
# Find the biggest offenders
ssh root@5.161.189.118 'du -sh /var/lib/docker/volumes/* 2>/dev/null | sort -rh | head -10'
```

### 2. Verify Backups Exist

#### Proxmox VM Backups
```bash
ssh root@162.55.102.87 'ls -lht /mnt/pve/FSN1-BX507/dump/ 2>/dev/null | head -10 || echo "No backup directory found at expected path"'
```

- [ ] Backups are present
- [ ] Most recent backup is less than 24 hours old (if daily schedule) or 7 days (if weekly)
- [ ] File sizes look reasonable (not 0 bytes, not truncated)

#### Docker Volume Backups (once you set up the backup script from the maintenance plan)
```bash
ssh root@5.161.189.118 'ls -lht /mnt/HC_Volume_104873979/backups/ 2>/dev/null | head -5 || echo "No backup directory found"'
```

- [ ] Backup directory has recent entries
- [ ] Tar files are non-zero size

#### cPanel Backups
```bash
ssh -p 2222 root@144.76.216.70 'ls -lht /backup/ 2>/dev/null | head -5 && echo "---" && ls /backup/weekly/ 2>/dev/null | head -5 || echo "Check WHM backup config"'
```

- [ ] Backups running on schedule
- [ ] Accounts present in latest backup set

### 3. Review All Server Disk Usage

```bash
for server in "root@162.55.102.87" "root@5.161.189.118" "root@128.140.81.55" "root@128.140.87.0"; do
  echo "=== $server ==="
  ssh $server 'hostname && df -h / | tail -1' 2>/dev/null || echo "UNREACHABLE"
done

echo "=== cPanel (port 2222) ==="
ssh -p 2222 root@144.76.216.70 'hostname && df -h / /home | tail -2' 2>/dev/null || echo "UNREACHABLE"
```

- [ ] Proxmox host: below 50%
- [ ] cPanel root: below 60%
- [ ] cPanel /home: below 70%
- [ ] Docker: below 85% (critical threshold)
- [ ] Apps: below 50%
- [ ] Paperclip: below 50%

### 4. Review Memory and Swap

```bash
for server in "root@162.55.102.87" "root@5.161.189.118" "root@128.140.81.55" "root@128.140.87.0"; do
  echo "=== $server ==="
  ssh $server 'hostname && free -h | head -2' 2>/dev/null || echo "UNREACHABLE"
done

echo "=== cPanel (port 2222) ==="
ssh -p 2222 root@144.76.216.70 'hostname && free -h' 2>/dev/null || echo "UNREACHABLE"
```

- [ ] Proxmox: available memory above 20 GB
- [ ] Docker: available memory above 2 GB
- [ ] cPanel: swap usage not growing week over week (record it: ___ GB this week)
- [ ] Apps: no unexpected memory consumption
- [ ] Paperclip: no unexpected memory consumption

### 5. Check Docker Container Logs for Errors

```bash
ssh root@5.161.189.118 << 'EOF'
for c in n8n caddy mysql prostat-staging-db-1 wordpress; do
  echo "=== $c ==="
  docker logs $c --since 168h 2>&1 | grep -ci "error\|fatal\|panic\|killed"
  echo "error/fatal mentions in last 7 days"
  echo ""
done
EOF
```

- [ ] n8n: error count is low and stable
- [ ] caddy: no TLS or upstream errors
- [ ] mysql: no crash recovery messages
- [ ] prostat-staging-db: redo log warnings still present? (track until fixed)
- [ ] wordpress: no fatal errors

### 6. Check SSL Certificate Expiry

```bash
for domain in psgweb.me n8n.psgweb.me portainer.psgweb.me psgdigital.co degweb.org app.prostatgun.com; do
  echo -n "$domain: "
  echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || echo "FAILED TO CHECK"
done
```

- [ ] All certificates expire more than 14 days from now
- [ ] If any certificate is within 14 days, investigate Caddy auto-renewal or cPanel AutoSSL

### 7. Verify Tailscale Connectivity

```bash
for server in "root@128.140.81.55" "root@128.140.87.0"; do
  echo "=== $server ==="
  ssh $server 'tailscale status --peers=false' 2>/dev/null || echo "UNREACHABLE"
done
```

- [ ] Both apps and paperclip servers show as connected
- [ ] Tailscale IP matches expected (apps: 100.111.36.128, paperclip: 100.72.246.66)

---

## MONTHLY (1-2 hours, first Saturday)

Goal: Patch systems, update containers, test a backup, audit access.

### 1. OS Security Patches

Run in this order. Wait for each server to come back before moving to the next. Do not patch multiple servers at the same time.

#### Step 1: Proxmox Host
```bash
ssh root@162.55.102.87 << 'EOF'
apt update
apt list --upgradable
# Review the list, then:
apt upgrade -y
# If kernel was updated:
# pve-manager will show "reboot required" in the web UI
# Schedule reboot for Sunday 2-4 AM CST
EOF
```

- [ ] Packages updated
- [ ] Reboot scheduled if kernel updated
- [ ] Proxmox web UI accessible after reboot

#### Step 2: cPanel Server
```bash
ssh -p 2222 root@144.76.216.70 << 'EOF'
# cPanel manages most updates via upcp
/scripts/upcp --force
# System packages:
dnf update -y
# CloudLinux kernel:
kcarectl --update 2>/dev/null || echo "KernelCare not installed, reboot for kernel updates"
EOF
```

- [ ] cPanel updated
- [ ] System packages updated
- [ ] All cPanel services running: `/scripts/restartsrv_httpd && /scripts/restartsrv_mysql`

#### Step 3: Docker Server
```bash
ssh root@5.161.189.118 << 'EOF'
apt update && apt upgrade -y
# Check if reboot needed:
[ -f /var/run/reboot-required ] && echo "REBOOT REQUIRED" || echo "No reboot needed"
EOF
```

- [ ] Packages updated
- [ ] If reboot required, schedule for Sunday 2-4 AM CST
- [ ] After reboot, verify all containers came back: `docker ps`

#### Step 4: Apps Server
```bash
ssh root@128.140.81.55 'apt update && apt upgrade -y && [ -f /var/run/reboot-required ] && echo "REBOOT REQUIRED" || echo "No reboot needed"'
```

- [ ] Updated

#### Step 5: Paperclip Server
```bash
ssh root@128.140.87.0 'apt update && apt upgrade -y && [ -f /var/run/reboot-required ] && echo "REBOOT REQUIRED" || echo "No reboot needed"'
```

- [ ] Updated

### 2. Update Docker Images

```bash
ssh root@5.161.189.118 << 'EOF'
echo "=== CHECKING FOR IMAGE UPDATES ==="

# List current images and their ages
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}\t{{.Size}}"

# Pull latest for each compose project
# Adjust paths to match your actual docker-compose locations
cd /root

# Find all docker-compose files and pull
for dir in $(find /root /srv /opt -name "docker-compose*.yml" -o -name "compose.yml" 2>/dev/null | xargs dirname | sort -u); do
  echo "=== Updating $dir ==="
  cd "$dir"
  docker compose pull 2>/dev/null || docker-compose pull 2>/dev/null
  docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
  cd /root
done

echo "=== CLEANING OLD IMAGES ==="
docker image prune -f

echo "=== DISK AFTER UPDATES ==="
df -h /
EOF
```

- [ ] Images pulled successfully
- [ ] All containers restarted and healthy
- [ ] Old images cleaned up
- [ ] Disk usage acceptable after updates

### 3. Test a Backup Restoration

Pick one item each month and rotate through this list:

| Month | Test Target | How to Test |
|-------|------------|-------------|
| January, May, September | cPanel account | Restore one account to a temporary subdomain |
| February, June, October | Proxmox VM | Restore to a temporary VM ID, boot it, verify |
| March, July, November | Docker volume (n8n) | Restore tar to temp directory, inspect files |
| April, August, December | Full DR walkthrough | Document how long each step takes |

```bash
# Example: test Docker volume restore
ssh root@5.161.189.118 << 'EOF'
LATEST=$(ls -t /mnt/HC_Volume_104873979/backups/ | head -1)
echo "Testing restore from: $LATEST"
mkdir -p /tmp/restore-test
cd /tmp/restore-test
# Pick one volume to test
tar xzf /mnt/HC_Volume_104873979/backups/$LATEST/n8n_data.tar.gz 2>/dev/null && echo "RESTORE OK" || echo "RESTORE FAILED"
ls -la /tmp/restore-test/
rm -rf /tmp/restore-test
EOF
```

- [ ] Backup file was readable
- [ ] Data restored successfully
- [ ] Restored data looks correct (not empty, not corrupted)

### 4. Audit SSH Access

```bash
for server in "root@162.55.102.87" "root@5.161.189.118" "root@128.140.81.55" "root@128.140.87.0"; do
  echo "=== $server ==="
  ssh $server << 'INNER'
  echo "Authorized keys:"
  cat /root/.ssh/authorized_keys 2>/dev/null | wc -l
  echo "key count"
  echo ""
  echo "Recent SSH logins:"
  last -5 | head -6
  echo ""
  echo "Failed login attempts (last 7 days):"
  journalctl _COMM=sshd --since "7 days ago" 2>/dev/null | grep -c "Failed password" || grep -c "Failed password" /var/log/auth.log 2>/dev/null || echo "0"
INNER
done

echo "=== cPanel ==="
ssh -p 2222 root@144.76.216.70 << 'INNER'
echo "Authorized keys:"
cat /root/.ssh/authorized_keys 2>/dev/null | wc -l
echo "key count"
echo "Recent SSH logins:"
last -5 | head -6
echo "Failed login attempts (last 7 days):"
grep -c "Failed password" /var/log/secure 2>/dev/null || echo "0"
INNER
```

- [ ] Only expected SSH keys are present on each server
- [ ] No unexpected user logins in `last` output
- [ ] Failed login attempts are at normal levels (some is expected, a spike means brute force)
- [ ] If failed attempts are high (1000+), verify fail2ban or CSF is blocking offenders

### 5. Review Hetzner Billing and Resources

- [ ] Log into https://robot.hetzner.com
- [ ] Confirm server payment is current (check paid_until date)
- [ ] Review any bandwidth or traffic warnings
- [ ] Log into Hetzner Cloud console for apps/paperclip/docker servers
- [ ] Check for any billing alerts or resource warnings

### 6. Review cPanel Account Disk Growth

```bash
ssh -p 2222 root@144.76.216.70 '/usr/local/cpanel/bin/whmapi1 listaccts --output=jsonpretty' 2>/dev/null | grep -A2 '"domain"\|"diskused"'
```

Record the top accounts and compare to last month:

| Account | Last Month | This Month | Delta |
|---------|-----------|------------|-------|
| psgdigit (psgdigital.co) | ___ MB | ___ MB | |
| psgdev (dev.psghub.me) | ___ MB | ___ MB | |
| degweb (degweb.org) | ___ MB | ___ MB | |
| prostatgun (app.prostatgun.com) | ___ MB | ___ MB | |

- [ ] No account growing faster than expected
- [ ] psgdigital.co (currently 277 GB) reviewed for archivable content

### 7. Check Proxmox Storage Health

```bash
ssh root@162.55.102.87 << 'EOF'
echo "=== RAID STATUS ==="
cat /proc/mdstat

echo "=== SMART STATUS (disk 0) ==="
smartctl -H /dev/sda 2>/dev/null || echo "smartctl not available for this device"

echo "=== STORAGE BOX MOUNT ==="
df -h /mnt/pve/FSN1-BX507 /mnt/pve/nas

echo "=== VM DISK USAGE ==="
pvesh get /nodes/s1/status --output-format json-pretty 2>/dev/null | grep -A2 "rootfs\|memory"
EOF
```

- [ ] RAID arrays healthy (no degraded drives)
- [ ] SMART status shows PASSED
- [ ] Storage box and NAS mounts are accessible
- [ ] No VM disk approaching its allocation limit

---

## QUARTERLY (2-4 hours)

Goal: Deeper review, strategic cleanup, DR validation.

### 1. Full Firewall Audit

```bash
# Proxmox host
ssh root@162.55.102.87 'iptables -L -n --line-numbers 2>/dev/null; echo "---"; pve-firewall status 2>/dev/null'

# cPanel
ssh -p 2222 root@144.76.216.70 'csf -l 2>/dev/null | head -30 || iptables -L -n | head -30'

# Docker
ssh root@5.161.189.118 'ufw status verbose 2>/dev/null || iptables -L -n | head -20'

# Apps
ssh root@128.140.81.55 'ufw status verbose 2>/dev/null || iptables -L -n | head -20'

# Paperclip
ssh root@128.140.87.0 'ufw status verbose 2>/dev/null || iptables -L -n | head -20'
```

- [ ] Proxmox host firewall is enabled (not in "disabled" state)
- [ ] Only required ports are open on each server
- [ ] No "allow all" rules exist
- [ ] cPanel CSF is active and blocking brute force
- [ ] Docker server UFW (or equivalent) is active

### 2. Review and Rotate SSH Keys

```bash
# Check key ages on your local machine
ls -la ~/.ssh/*.pub

# On each server, list all authorized keys with comments
for server in "root@162.55.102.87" "root@5.161.189.118" "root@128.140.81.55" "root@128.140.87.0"; do
  echo "=== $server ==="
  ssh $server 'cat /root/.ssh/authorized_keys' 2>/dev/null
done
```

- [ ] All keys are recognized (no mystery keys)
- [ ] Keys older than 12 months flagged for rotation
- [ ] Remove keys for anyone who no longer needs access

### 3. Docker Container Version Audit

```bash
ssh root@5.161.189.118 'docker ps --format "{{.Names}}: {{.Image}}"'
```

Cross-reference each image against its upstream release page:

- [ ] mysql:5.7 (wp_mysql): UPGRADE TO 8.0. MySQL 5.7 is end-of-life.
- [ ] All other images: check for security advisories
- [ ] n8n-custom:2.3.6: compare against latest n8n release

### 4. Full Disaster Recovery Walkthrough

Do not actually destroy anything. Instead, document:

- [ ] Time to provision a new bare metal server from Hetzner
- [ ] Time to restore Proxmox VMs from storage box backup
- [ ] Time to rebuild Docker server from compose files + volume backups
- [ ] Time to restore cPanel accounts from backup
- [ ] Total estimated recovery time: ___ hours
- [ ] Update the PSG-Server-Maintenance-Plan.md with current recovery estimates

### 5. Capacity Planning

Record current utilization and project forward:

| Resource | Current | 3-Month Trend | Action Needed? |
|----------|---------|---------------|----------------|
| Proxmox RAM | ___/125 GB | | |
| Proxmox disk | ___/1.7 TB | | |
| cPanel /home | ___/1.1 TB | | |
| Docker root disk | ___/75 GB | | |
| Storage box | ___/20 TB | | |
| NAS | ___/12 TB | | |

- [ ] No resource will hit 90% within the next quarter
- [ ] If any resource is trending toward 90%, plan an upgrade

---

## ANNUALLY (half day)

Goal: Strategic review, long-term health.

### 1. Server Right-Sizing

- [ ] Review each Hetzner Cloud server's CPU and RAM utilization over the past year
- [ ] Downsize any server that consistently uses less than 20% of its resources
- [ ] Upsize any server that regularly exceeds 80%
- [ ] Evaluate whether workloads should be consolidated or split

### 2. Full Security Audit

- [ ] Rotate all SSH keys
- [ ] Review and update all service passwords
- [ ] Check for any services running as root that should not be
- [ ] Review Docker container privilege levels
- [ ] Consider a third-party penetration test
- [ ] Review Cloudflare security settings and WAF rules

### 3. Infrastructure Cost Review

- [ ] Total monthly spend across all Hetzner services
- [ ] Cost per workload (which services justify their server costs)
- [ ] Compare current Hetzner pricing to alternatives
- [ ] Review storage box utilization vs. cost
- [ ] Identify any unused resources to decommission

### 4. Documentation Update

- [ ] Re-run the infrastructure audit scripts to regenerate fresh reports
- [ ] Update this runbook with any new servers, IPs, or services
- [ ] Update the PSG-Server-Maintenance-Plan.md
- [ ] Verify all SSH commands in this runbook still work
- [ ] Archive the previous year's monthly tracking data

### 5. Licensing and Renewals

- [ ] cPanel/WHM license current
- [ ] CloudLinux license current
- [ ] Domain registrations reviewed (check expiry dates)
- [ ] Any software subscriptions reviewed

---

## INCIDENT RESPONSE QUICK REFERENCE

If something is down, use this decision tree.

### Website Down (cPanel-hosted site)

```
1. Can you reach the server?
   ssh -p 2222 root@144.76.216.70 'uptime'

   NO -> Check Proxmox (is the VM running?)
         ssh root@162.55.102.87 'qm list'
         If VM is stopped: qm start <VMID>
         If Proxmox unreachable: Check Hetzner Robot for hardware issues

   YES -> Check Apache/LiteSpeed:
          /scripts/restartsrv_httpd
          Check MySQL:
          /scripts/restartsrv_mysql
          Check specific account:
          /scripts/suspendacct USERNAME  (then unsuspend to reset)
```

### Docker Service Down

```
1. Which container is down?
   ssh root@5.161.189.118 'docker ps -a --format "table {{.Names}}\t{{.Status}}"'

2. Check logs:
   docker logs <container_name> --tail 50

3. Restart the container:
   docker restart <container_name>

4. If it won't start, check disk:
   df -h /
   If disk full: docker system prune -a --volumes (WARNING: removes unused volumes)

5. If still broken, recreate from compose:
   cd /path/to/compose/dir
   docker compose down && docker compose up -d
```

### Server Unreachable

```
1. Ping it:
   ping <IP>

2. If no ping response:
   - Hetzner Cloud servers (apps, paperclip, docker):
     Log into Hetzner Cloud console, check server status, use web console
   - Bare metal (proxmox):
     Log into Hetzner Robot, check server status, request hardware reset

3. If ping works but SSH fails:
   - Try from a different network (SSH might be blocked by your IP)
   - Use Hetzner console access (Robot for bare metal, Cloud for VMs)
   - Check if fail2ban or CSF banned your IP
```

---

## TRACKING LOG

Use this section to record your weekly and monthly check results. Copy the template row each time.

### Weekly Log

| Date | Docker Disk % | cPanel Swap GB | Backups OK? | Containers OK? | Notes |
|------|--------------|----------------|-------------|----------------|-------|
| YYYY-MM-DD | __% | __ GB | Y/N | Y/N | |

### Monthly Log

| Date | Patches Applied | Backup Tested | SSH Audit Clean? | Disk Growth Issues? | Notes |
|------|----------------|---------------|------------------|--------------------|-|
| YYYY-MM | Y/N | What was tested | Y/N | Y/N | |

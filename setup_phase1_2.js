const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== 1. Formatting Storage (HDD SAS) ==="
    # Remove existing partition signatures if any
    wipefs -a /dev/sda
    
    # Create partition table and 1 primary partition
    echo -e "o\\nn\\np\\n1\\n\\n\\nw" | fdisk /dev/sda
    
    # Wait for OS to recognize partition
    sleep 2
    
    # Format to ext4
    echo "Formatting /dev/sda1 to ext4..."
    mkfs.ext4 -F /dev/sda1
    
    echo ""
    echo "=== 2. Mounting Storage ==="
    mkdir -p /mnt/backup-sas
    
    # Add to fstab if not exists
    if ! grep -q "/mnt/backup-sas" /etc/fstab; then
      echo "/dev/sda1 /mnt/backup-sas ext4 defaults 0 2" >> /etc/fstab
    fi
    
    # Mount it
    mount -a
    
    # Check if mount is successful
    if mountpoint -q /mnt/backup-sas; then
      echo "Mount successful."
      
      echo ""
      echo "=== 3. Registering to Proxmox ==="
      # Add storage to Proxmox if not exists
      if ! pvesm status | grep -q "backup-sas"; then
        pvesm add dir backup-sas --path /mnt/backup-sas --content backup,vztmpl,iso --is_mountpoint 1
        echo "Storage registered in Proxmox."
      else
        echo "Storage backup-sas already registered."
      fi
    else
      echo "ERROR: Mount failed!"
    fi

    echo ""
    echo "=== 4. Installing Tailscale ==="
    curl -fsSL https://tailscale.com/install.sh | sh
    
    echo ""
    echo "=== 5. Verification ==="
    pvesm status
    tailscale --version
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '192.168.51.100',
  port: 22,
  username: 'root',
  password: '$&Admin2004',
  readyTimeout: 10000
});

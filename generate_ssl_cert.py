# generate_ssl_cert.py - Create self-signed SSL certificate
from OpenSSL import crypto
import os

def create_self_signed_cert(cert_dir="ssl_certs"):
    """Create a self-signed SSL certificate for localhost"""
    
    # Create directory if it doesn't exist
    if not os.path.exists(cert_dir):
        os.makedirs(cert_dir)
    
    # Create a key pair
    key = crypto.PKey()
    key.generate_key(crypto.TYPE_RSA, 2048)
    
    # Create a self-signed certificate
    cert = crypto.X509()
    cert.get_subject().C = "IN"
    cert.get_subject().ST = "State"
    cert.get_subject().L = "City"
    cert.get_subject().O = "HatchOS"
    cert.get_subject().OU = "Development"
    cert.get_subject().CN = "192.168.29.164"
    
    # Add Subject Alternative Names for both localhost and IP
    cert.add_extensions([
        crypto.X509Extension(b"subjectAltName", False, 
            b"DNS:localhost,DNS:*.localhost,IP:192.168.29.164,IP:127.0.0.1")
    ])
    
    cert.set_serial_number(1000)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(365*24*60*60)  # Valid for 1 year
    cert.set_issuer(cert.get_subject())
    cert.set_pubkey(key)
    cert.sign(key, 'sha256')
    
    # Write certificate and key to files
    cert_file = os.path.join(cert_dir, "cert.pem")
    key_file = os.path.join(cert_dir, "key.pem")
    
    with open(cert_file, "wb") as f:
        f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
    
    with open(key_file, "wb") as f:
        f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, key))
    
    print(f"✅ SSL Certificate created successfully!")
    print(f"📁 Certificate: {cert_file}")
    print(f"🔑 Private Key: {key_file}")
    print()
    print("⚠️  IMPORTANT: You need to trust this certificate in your browser!")
    print("   Chrome: Visit https://192.168.29.164:5000 and click 'Advanced' -> 'Proceed'")
    print("   Or import cert.pem to your system's trusted certificates")
    
    return cert_file, key_file

if __name__ == "__main__":
    create_self_signed_cert()

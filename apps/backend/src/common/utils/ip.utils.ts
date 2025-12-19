export function normalizeIp(ip: string | undefined | null): string | null {
  if (!ip) return null;

  // Remove whitespace
  ip = ip.trim();

  // Convert IPv4-mapped IPv6 to IPv4
  // Format: ::ffff:192.168.1.1 or ::ffff:172.21.0.1
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7); // Remove '::ffff:' prefix
  }

  // Validate IPv4 format (simple check)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    // Additional validation: check each octet is 0-255
    const octets = ip.split(".");
    const isValid = octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });

    if (isValid) {
      return ip;
    }
  }

  // Validate IPv6 format (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Regex.test(ip)) {
    return ip;
  }

  // If we got here, IP is invalid
  return null;
}

export function getClientIp(req: any): string | null {
  // Priority order:
  // 1. x-forwarded-for (proxy/load balancer)
  // 2. x-real-ip (nginx proxy)
  // 3. connection.remoteAddress
  // 4. socket.remoteAddress

  let ip: string | undefined;

  // Check x-forwarded-for header (can contain multiple IPs)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    // x-forwarded-for can be: "client, proxy1, proxy2"
    // We want the first (client) IP
    ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0];
  }

  // Check x-real-ip header
  if (!ip) {
    ip = req.headers["x-real-ip"];
  }

  // Check connection.remoteAddress
  if (!ip) {
    ip = req.connection?.remoteAddress;
  }

  // Check socket.remoteAddress
  if (!ip) {
    ip = req.socket?.remoteAddress;
  }

  // Normalize and validate
  return normalizeIp(ip);
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;

  // Remove IPv4-mapped IPv6 prefix if present
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) return false;

  // Check for localhost
  if (normalizedIp === "127.0.0.1" || normalizedIp === "::1") {
    return true;
  }

  // Check for private IPv4 ranges
  const octets = normalizedIp.split(".");
  if (octets.length === 4) {
    const first = parseInt(octets[0], 10);
    const second = parseInt(octets[1], 10);

    // 10.0.0.0 - 10.255.255.255
    if (first === 10) return true;

    // 172.16.0.0 - 172.31.255.255
    if (first === 172 && second >= 16 && second <= 31) return true;

    // 192.168.0.0 - 192.168.255.255
    if (first === 192 && second === 168) return true;

    // 169.254.0.0 - 169.254.255.255 (link-local)
    if (first === 169 && second === 254) return true;
  }

  // Check for private IPv6 ranges
  if (normalizedIp.startsWith("fe80:") || normalizedIp.startsWith("fc00:")) {
    return true;
  }

  return false;
}

export function formatIp(ip: string | null | undefined): string {
  const normalized = normalizeIp(ip);
  return normalized || "Unknown";
}

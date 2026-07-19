export interface Product {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: { name: string; slug: string };
  brand?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  specifications?: Record<string, any>;
}

export function checkCPUAndMotherboard(cpu: Product | null, motherboard: Product | null): { compatible: boolean; message?: string } {
  if (!cpu || !motherboard) return { compatible: true };
  const cpuSocket = cpu.specifications?.socket;
  const moboSocket = motherboard.specifications?.socket;
  if (cpuSocket && moboSocket && cpuSocket.toLowerCase() !== moboSocket.toLowerCase()) {
    return {
      compatible: false,
      message: `CPU socket (${cpuSocket}) is incompatible with Motherboard socket (${moboSocket}).`,
    };
  }
  return { compatible: true };
}

export function checkMotherboardAndRAM(motherboard: Product | null, ram: Product | null): { compatible: boolean; message?: string } {
  if (!motherboard || !ram) return { compatible: true };
  const moboMemoryType = motherboard.specifications?.memory_type;
  const ramMemoryType = ram.specifications?.memory_type;
  if (moboMemoryType && ramMemoryType && moboMemoryType.toLowerCase() !== ramMemoryType.toLowerCase()) {
    return {
      compatible: false,
      message: `Motherboard supports ${moboMemoryType} RAM, but selected RAM is ${ramMemoryType}.`,
    };
  }
  return { compatible: true };
}

export function checkMotherboardAndCasing(motherboard: Product | null, casing: Product | null): { compatible: boolean; message?: string } {
  if (!motherboard || !casing) return { compatible: true };
  const moboFormFactor = motherboard.specifications?.form_factor;
  const casingSupport = casing.specifications?.motherboard_support;
  if (moboFormFactor && casingSupport && Array.isArray(casingSupport)) {
    const isSupported = casingSupport.some(
      (support: string) => support.toLowerCase() === moboFormFactor.toLowerCase()
    );
    if (!isSupported) {
      return {
        compatible: false,
        message: `Motherboard form factor (${moboFormFactor}) is not supported by the Casing (supports: ${casingSupport.join(", ")}).`,
      };
    }
  }
  return { compatible: true };
}

export function checkCPUAndCooler(cpu: Product | null, cooler: Product | null): { compatible: boolean; message?: string } {
  if (!cpu || !cooler) return { compatible: true };
  const cpuSocket = cpu.specifications?.socket;
  const coolerSupport = cooler.specifications?.socket_support;
  if (cpuSocket && coolerSupport && Array.isArray(coolerSupport)) {
    const isSupported = coolerSupport.some(
      (support: string) => support.toLowerCase() === cpuSocket.toLowerCase()
    );
    if (!isSupported) {
      return {
        compatible: false,
        message: `CPU socket (${cpuSocket}) is not supported by CPU Cooler (supports: ${coolerSupport.join(", ")}).`,
      };
    }
  }
  return { compatible: true };
}

export function calculateMinPSUWattage(cpu: Product | null, gpu: Product | null): number {
  const cpuTdp = Number(cpu?.specifications?.tdp) || 125; // default standard CPU tdp
  const gpuTdp = Number(gpu?.specifications?.tdp) || 200; // default standard GPU tdp
  return cpuTdp + gpuTdp + 150; // extra headroom
}

export function checkPSU(cpu: Product | null, gpu: Product | null, psu: Product | null): { compatible: boolean; message?: string } {
  if (!psu) return { compatible: true };
  const psuWattage = Number(psu.specifications?.wattage);
  if (!psuWattage) return { compatible: true };

  const minWattage = calculateMinPSUWattage(cpu, gpu);
  if (psuWattage < minWattage) {
    return {
      compatible: false,
      message: `Selected PSU (${psuWattage}W) has lower capacity than estimated minimum required (${minWattage}W).`,
    };
  }
  return { compatible: true };
}

export function getCompatibilityWarnings(selected: Record<string, Product>): string[] {
  const warnings: string[] = [];
  const cpu = selected.cpu || null;
  const motherboard = selected.motherboard || null;
  const ram = selected.ram || null;
  const cooler = selected.cooler || null;
  const psu = selected.psu || null;
  const casing = selected.casing || null;
  const gpu = selected.gpu || null;

  const cpuMobo = checkCPUAndMotherboard(cpu, motherboard);
  if (!cpuMobo.compatible && cpuMobo.message) warnings.push(cpuMobo.message);

  const moboRam = checkMotherboardAndRAM(motherboard, ram);
  if (!moboRam.compatible && moboRam.message) warnings.push(moboRam.message);

  const moboCasing = checkMotherboardAndCasing(motherboard, casing);
  if (!moboCasing.compatible && moboCasing.message) warnings.push(moboCasing.message);

  const cpuCooler = checkCPUAndCooler(cpu, cooler);
  if (!cpuCooler.compatible && cpuCooler.message) warnings.push(cpuCooler.message);

  const psuCheck = checkPSU(cpu, gpu, psu);
  if (!psuCheck.compatible && psuCheck.message) warnings.push(psuCheck.message);

  return warnings;
}

export function getCompatibleProducts(
  categorySlug: string,
  allProducts: Product[],
  currentBuild: Record<string, Product>
): Product[] {
  const productsInCategory = allProducts.filter(
    (p) => p.category?.slug?.toLowerCase() === categorySlug.toLowerCase()
  );

  const cpu = currentBuild.cpu || null;
  const motherboard = currentBuild.motherboard || null;
  const gpu = currentBuild.gpu || null;
  const casing = currentBuild.casing || null;

  return productsInCategory.filter((product) => {
    if (categorySlug === "cpu") {
      // Check motherboard socket
      const moboCheck = checkCPUAndMotherboard(product, motherboard);
      if (!moboCheck.compatible) return false;
      // Check cooler support
      const coolerCheck = checkCPUAndCooler(product, currentBuild.cooler || null);
      if (!coolerCheck.compatible) return false;
      // Check PSU capacity
      const psuCheck = checkPSU(product, gpu, currentBuild.psu || null);
      if (!psuCheck.compatible) return false;
    } else if (categorySlug === "motherboard") {
      // Check cpu socket
      const cpuCheck = checkCPUAndMotherboard(cpu, product);
      if (!cpuCheck.compatible) return false;
      // Check RAM type
      const ramCheck = checkMotherboardAndRAM(product, currentBuild.ram || null);
      if (!ramCheck.compatible) return false;
      // Check casing support
      const casingCheck = checkMotherboardAndCasing(product, casing);
      if (!casingCheck.compatible) return false;
    } else if (categorySlug === "ram") {
      // Check memory type
      const moboCheck = checkMotherboardAndRAM(motherboard, product);
      if (!moboCheck.compatible) return false;
    } else if (categorySlug === "cooler") {
      // Check socket support
      const cpuCheck = checkCPUAndCooler(cpu, product);
      if (!cpuCheck.compatible) return false;
    } else if (categorySlug === "casing") {
      // Check motherboard support
      const moboCheck = checkMotherboardAndCasing(motherboard, product);
      if (!moboCheck.compatible) return false;
    } else if (categorySlug === "psu") {
      // Check wattage capacity
      const psuCheck = checkPSU(cpu, gpu, product);
      if (!psuCheck.compatible) return false;
    } else if (categorySlug === "gpu") {
      // Check PSU capacity
      const psuCheck = checkPSU(cpu, product, currentBuild.psu || null);
      if (!psuCheck.compatible) return false;
    }
    return true;
  });
}

function bitsToUint(b) {
  return parseInt(b, 2);
}

function signExtend(value, width) {
  const signBit = 1 << (width - 1);
  return (value ^ signBit) - signBit;
}

function regName(n) {
  return `x${n}`;
}

function hexImm(value, widthBits) {
  const mask = (1 << widthBits) - 1;
  return `0x${(value & mask).toString(16).toUpperCase()}`;
}

function decodeR(inst) {
  const funct7 = bitsToUint(inst.slice(0, 7));
  const rs2 = bitsToUint(inst.slice(7, 12));
  const rs1 = bitsToUint(inst.slice(12, 17));
  const funct3 = bitsToUint(inst.slice(17, 20));
  const rd = bitsToUint(inst.slice(20, 25));

  let op = null;

  if (funct3 === 0b000) {
    op = funct7 === 0b0100000 ? "sub" : "add";
  } else if (funct3 === 0b001) {
    op = "sll";
  } else if (funct3 === 0b010) {
    op = "slt";
  } else if (funct3 === 0b011) {
    op = "sltu";
  } else if (funct3 === 0b100) {
    op = "xor";
  } else if (funct3 === 0b101) {
    op = funct7 === 0b0100000 ? "sra" : "srl";
  } else if (funct3 === 0b110) {
    op = "or";
  } else if (funct3 === 0b111) {
    op = "and";
  }

  return [
    "Instruction Type: R",
    `Operation: ${op}`,
    `Rs1: ${regName(rs1)}`,
    `Rs2: ${regName(rs2)}`,
    `Rd: ${regName(rd)}`,
    `Funct3: ${funct3}`,
    `Funct7: ${funct7}`
  ].join("\n");
}

function decodeI(inst, opcode) {
  const imm12 = bitsToUint(inst.slice(0, 12));
  const rs1 = bitsToUint(inst.slice(12, 17));
  const funct3 = bitsToUint(inst.slice(17, 20));
  const rd = bitsToUint(inst.slice(20, 25));

  let op = null;
  let immVal = null;
  let immWidth = 12;

  if (opcode === 0b0000011) {
    if (funct3 === 0b000) op = "lb";
    else if (funct3 === 0b001) op = "lh";
    else if (funct3 === 0b010) op = "lw";

    immVal = signExtend(imm12, 12);
  } else if (opcode === 0b1100111) {
    op = "jalr";
    immVal = signExtend(imm12, 12);
  } else if (opcode === 0b0010011) {
    if (funct3 === 0b000) {
      op = "addi";
      immVal = signExtend(imm12, 12);
    } else if (funct3 === 0b010) {
      op = "slti";
      immVal = signExtend(imm12, 12);
    } else if (funct3 === 0b011) {
      op = "sltiu";
      immVal = signExtend(imm12, 12);
    } else if (funct3 === 0b100) {
      op = "xori";
      immVal = signExtend(imm12, 12);
    } else if (funct3 === 0b110) {
      op = "ori";
      immVal = signExtend(imm12, 12);
    } else if (funct3 === 0b111) {
      op = "andi";
      immVal = signExtend(imm12, 12);
    } else if (funct3 === 0b001) {
      op = "slli";
      const shamt = bitsToUint(inst.slice(7, 12));
      immVal = shamt;
      immWidth = 5;
    } else if (funct3 === 0b101) {
      const funct7 = bitsToUint(inst.slice(0, 7));
      const shamt = bitsToUint(inst.slice(7, 12));
      op = funct7 === 0b0100000 ? "srai" : "srli";
      immVal = shamt;
      immWidth = 5;
    }
  }

  return [
    "Instruction Type: I",
    `Operation: ${op}`,
    `Rs1: ${regName(rs1)}`,
    `Rd: ${regName(rd)}`,
    `Immediate: ${immVal} (or ${hexImm(immVal, immWidth)})`
  ].join("\n");
}

function decodeS(inst) {
  const immHi = bitsToUint(inst.slice(0, 7));
  const rs2 = bitsToUint(inst.slice(7, 12));
  const rs1 = bitsToUint(inst.slice(12, 17));
  const funct3 = bitsToUint(inst.slice(17, 20));
  const immLo = bitsToUint(inst.slice(20, 25));
  const imm12 = (immHi << 5) | immLo;
  const immVal = signExtend(imm12, 12);

  let op = null;
  if (funct3 === 0b000) op = "sb";
  else if (funct3 === 0b001) op = "sh";
  else if (funct3 === 0b010) op = "sw";

  return [
    "Instruction Type: S",
    `Operation: ${op}`,
    `Rs1: ${regName(rs1)}`,
    `Rs2: ${regName(rs2)}`,
    `Immediate: ${immVal} (or ${hexImm(immVal, 12)})`
  ].join("\n");
}

function decodeSB(inst) {
  const rs2 = bitsToUint(inst.slice(7, 12));
  const rs1 = bitsToUint(inst.slice(12, 17));
  const funct3 = bitsToUint(inst.slice(17, 20));

  const bit12 = bitsToUint(inst.slice(0, 1));
  const bits10_5 = bitsToUint(inst.slice(1, 7));
  const bits4_1 = bitsToUint(inst.slice(20, 24));
  const bit11 = bitsToUint(inst.slice(24, 25));

  const imm13 = (bit12 << 12) | (bit11 << 11) | (bits10_5 << 5) | (bits4_1 << 1);
  const immVal = signExtend(imm13, 13);

  let op = null;
  if (funct3 === 0b000) op = "beq";
  else if (funct3 === 0b001) op = "bne";
  else if (funct3 === 0b100) op = "blt";
  else if (funct3 === 0b101) op = "bge";

  return [
    "Instruction Type: SB",
    `Operation: ${op}`,
    `Rs1: ${regName(rs1)}`,
    `Rs2: ${regName(rs2)}`,
    `Immediate: ${immVal}`
  ].join("\n");
}

function decodeUJ(inst) {
  const rd = bitsToUint(inst.slice(20, 25));

  const bit20 = bitsToUint(inst.slice(0, 1));
  const bits19_12 = bitsToUint(inst.slice(12, 20));
  const bit11 = bitsToUint(inst.slice(11, 12));
  const bits10_1 = bitsToUint(inst.slice(1, 11));

  const imm21 = (bit20 << 20) | (bits19_12 << 12) | (bit11 << 11) | (bits10_1 << 1);
  const immVal = signExtend(imm21, 21);

  return [
    "Instruction Type: UJ",
    "Operation: jal",
    `Rd: ${regName(rd)}`,
    `Immediate: ${immVal} (or ${hexImm(immVal, 21)})`
  ].join("\n");
}

function decode(inst) {
  const opcode = bitsToUint(inst.slice(25, 32));

  if (opcode === 0b0110011) {
    return decodeR(inst);
  } else if (opcode === 0b0010011 || opcode === 0b0000011 || opcode === 0b1100111) {
    return decodeI(inst, opcode);
  } else if (opcode === 0b0100011) {
    return decodeS(inst);
  } else if (opcode === 0b1100011) {
    return decodeSB(inst);
  } else if (opcode === 0b1101111) {
    return decodeUJ(inst);
  } else {
    return "Instruction Type: Unknown\nOperation: unknown";
  }
}

function runDecode() {
  const input = document.getElementById("instruction");
  const output = document.getElementById("output");

  let s = input.value.trim().replace(/\s+/g, "");

  if (s.length === 0) {
    output.textContent = "Please enter a binary instruction.";
    return;
  }

  if (!/^[01]+$/.test(s)) {
    output.textContent = "Instruction must contain only 0s and 1s.";
    return;
  }

  if (s.length !== 32) {
    output.textContent = `Instruction must be exactly 32 bits. Current length: ${s.length}`;
    return;
  }

  output.textContent = `${s}\n${decode(s)}`;
}

document.getElementById("decodeBtn").addEventListener("click", runDecode);

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("instruction").value = "";
  document.getElementById("output").textContent = "Output will appear here.";
});

document.getElementById("instruction").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runDecode();
  }
});

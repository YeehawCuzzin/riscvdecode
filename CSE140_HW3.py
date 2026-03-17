# CSE 140 HW/Lab 3: RISC-V Decoder
# Decodes only the tested instructions listed in the assignment.

def bits_to_uint(b: str) -> int:
    return int(b, 2)

def sign_extend(value: int, width: int) -> int:
    sign_bit = 1 << (width - 1)
    return (value ^ sign_bit) - sign_bit

def reg_name(n: int) -> str:
    return f"x{n}"

def hex_imm(value: int, width_bits: int) -> str:
    mask = (1 << width_bits) - 1
    return f"0x{(value & mask):X}"

def decode_r(inst: str):
    funct7 = bits_to_uint(inst[0:7])
    rs2    = bits_to_uint(inst[7:12])
    rs1    = bits_to_uint(inst[12:17])
    funct3 = bits_to_uint(inst[17:20])
    rd     = bits_to_uint(inst[20:25])

    op = None
    if funct3 == 0b000:
        op = "sub" if funct7 == 0b0100000 else "add"
    elif funct3 == 0b001:
        op = "sll"
    elif funct3 == 0b010:
        op = "slt"
    elif funct3 == 0b011:
        op = "sltu"
    elif funct3 == 0b100:
        op = "xor"
    elif funct3 == 0b101:
        op = "sra" if funct7 == 0b0100000 else "srl"
    elif funct3 == 0b110:
        op = "or"
    elif funct3 == 0b111:
        op = "and"

    print("Instruction Type: R")
    print(f"Operation: {op}")
    print(f"Rs1: {reg_name(rs1)}")
    print(f"Rs2: {reg_name(rs2)}")
    print(f"Rd: {reg_name(rd)}")
    print(f"Funct3: {funct3}")
    print(f"Funct7: {funct7}")

def decode_i(inst: str, opcode: int):
    imm12  = bits_to_uint(inst[0:12])
    rs1    = bits_to_uint(inst[12:17])
    funct3 = bits_to_uint(inst[17:20])
    rd     = bits_to_uint(inst[20:25])

    op = None
    imm_val = None
    imm_width = 12

    # I-type loads: opcode 0000011
    if opcode == 0b0000011:
        if funct3 == 0b000:
            op = "lb"
        elif funct3 == 0b001:
            op = "lh"
        elif funct3 == 0b010:
            op = "lw"
        imm_val = sign_extend(imm12, 12)

    # jalr: opcode 1100111
    elif opcode == 0b1100111:
        op = "jalr"
        imm_val = sign_extend(imm12, 12)

    # I-type ALU immediate: opcode 0010011
    elif opcode == 0b0010011:
        if funct3 == 0b000:
            op = "addi"
            imm_val = sign_extend(imm12, 12)
        elif funct3 == 0b010:
            op = "slti"
            imm_val = sign_extend(imm12, 12)
        elif funct3 == 0b011:
            op = "sltiu"
            imm_val = sign_extend(imm12, 12)
        elif funct3 == 0b100:
            op = "xori"
            imm_val = sign_extend(imm12, 12)
        elif funct3 == 0b110:
            op = "ori"
            imm_val = sign_extend(imm12, 12)
        elif funct3 == 0b111:
            op = "andi"
            imm_val = sign_extend(imm12, 12)
        elif funct3 == 0b001:
            # slli uses shamt in bits [24:20], funct7 must be 0000000
            op = "slli"
            shamt = bits_to_uint(inst[7:12])
            imm_val = shamt
            imm_width = 5
        elif funct3 == 0b101:
            # srli/srai decided by funct7 in bits [31:25]
            funct7 = bits_to_uint(inst[0:7])
            shamt = bits_to_uint(inst[7:12])
            op = "srai" if funct7 == 0b0100000 else "srli"
            imm_val = shamt
            imm_width = 5

    print("Instruction Type: I")
    print(f"Operation: {op}")
    print(f"Rs1: {reg_name(rs1)}")
    print(f"Rd: {reg_name(rd)}")

    # Match sample style: always show decimal, and also hex in parentheses
    print(f"Immediate: {imm_val} (or {hex_imm(imm_val, imm_width)})")

def decode_s(inst: str):
    imm_hi = bits_to_uint(inst[0:7])     # [31:25]
    rs2    = bits_to_uint(inst[7:12])
    rs1    = bits_to_uint(inst[12:17])
    funct3 = bits_to_uint(inst[17:20])
    imm_lo = bits_to_uint(inst[20:25])   # [11:7]
    imm12  = (imm_hi << 5) | imm_lo
    imm_val = sign_extend(imm12, 12)

    op = None
    if funct3 == 0b000:
        op = "sb"
    elif funct3 == 0b001:
        op = "sh"
    elif funct3 == 0b010:
        op = "sw"

    print("Instruction Type: S")
    print(f"Operation: {op}")
    print(f"Rs1: {reg_name(rs1)}")
    print(f"Rs2: {reg_name(rs2)}")
    print(f"Immediate: {imm_val} (or {hex_imm(imm_val, 12)})")

def decode_sb(inst: str):
    rs2    = bits_to_uint(inst[7:12])
    rs1    = bits_to_uint(inst[12:17])
    funct3 = bits_to_uint(inst[17:20])

    bit12   = bits_to_uint(inst[0:1])      # inst[31]
    bits10_5 = bits_to_uint(inst[1:7])     # inst[30:25]
    bits4_1  = bits_to_uint(inst[20:24])   # inst[11:8]
    bit11    = bits_to_uint(inst[24:25])   # inst[7]

    imm13 = (bit12 << 12) | (bit11 << 11) | (bits10_5 << 5) | (bits4_1 << 1)
    imm_val = sign_extend(imm13, 13)

    op = None
    if funct3 == 0b000:
        op = "beq"
    elif funct3 == 0b001:
        op = "bne"
    elif funct3 == 0b100:
        op = "blt"
    elif funct3 == 0b101:
        op = "bge"

    print("Instruction Type: SB")
    print(f"Operation: {op}")
    print(f"Rs1: {reg_name(rs1)}")
    print(f"Rs2: {reg_name(rs2)}")
    # Match sample: SB immediate printed without hex
    print(f"Immediate: {imm_val}")

def decode_uj(inst: str):
    rd = bits_to_uint(inst[20:25])

    bit20    = bits_to_uint(inst[0:1])      # inst[31]
    bits19_12 = bits_to_uint(inst[12:20])   # inst[19:12]
    bit11    = bits_to_uint(inst[11:12])    # inst[20]
    bits10_1 = bits_to_uint(inst[1:11])     # inst[30:21]

    imm21 = (bit20 << 20) | (bits19_12 << 12) | (bit11 << 11) | (bits10_1 << 1)
    imm_val = sign_extend(imm21, 21)

    print("Instruction Type: UJ")
    print("Operation: jal")
    print(f"Rd: {reg_name(rd)}")
    print(f"Immediate: {imm_val} (or {hex_imm(imm_val, 21)})")

def decode(inst: str):
    opcode = bits_to_uint(inst[25:32])

    if opcode == 0b0110011:
        decode_r(inst)
    elif opcode in (0b0010011, 0b0000011, 0b1100111):
        decode_i(inst, opcode)
    elif opcode == 0b0100011:
        decode_s(inst)
    elif opcode == 0b1100011:
        decode_sb(inst)
    elif opcode == 0b1101111:
        decode_uj(inst)
    else:
        # Assignment says inputs will be valid, so this should not be hit.
        print("Instruction Type: Unknown")
        print("Operation: unknown")

def main():
    while True:
        try:
            print("Enter an instruction:")
            s = input().strip()
        except EOFError:
            break

        if s == "":
            break

        s = s.replace(" ", "")
        # Assignment says valid format always, so no extra validation needed.
        print(s)
        decode(s)
        print()

if __name__ == "__main__":
    main()

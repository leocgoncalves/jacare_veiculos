import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { PasswordResetError, consumePasswordResetToken } from "@/lib/password-reset";

const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token inválido."),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .max(128, "A senha excede o tamanho máximo permitido."),
});

export async function POST(req: Request) {
  try {
    const payload = resetPasswordSchema.parse(await req.json());
    const newPasswordHash = await hashPassword(payload.password);

    await consumePasswordResetToken(payload.token, newPasswordHash);

    return NextResponse.json({
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", issues: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof PasswordResetError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("[reset-password] erro ao redefinir senha", error);
    return NextResponse.json(
      { message: "Não foi possível redefinir sua senha agora." },
      { status: 500 },
    );
  }
}

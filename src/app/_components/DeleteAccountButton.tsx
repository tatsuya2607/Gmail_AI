"use client";

interface Props {
  email: string;
  action: (formData: FormData) => Promise<void>;
  accountId: string;
}

export function DeleteAccountButton({ email, action, accountId }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`${email} を削除しますか？`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={accountId} />
      <button type="submit" className="btn-danger">削除</button>
    </form>
  );
}

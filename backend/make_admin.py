# backend/scripts/make_admin.py
"""
Interactive CLI tool to promote/demote users to/from admin role
"""
import asyncio
import getpass
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ POSTGRES_URL not found in .env")
    exit(1)

async def change_role(email: str, target_role: str = "admin"):
    engine = create_async_engine(DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        # Find user
        res = await conn.execute(
            text("SELECT id, name, email, role FROM users WHERE email = :e"),
            {"e": email}
        )
        user = res.fetchone()

        if not user:
            print(f"❌ No user found with email: {email}")
            return

        uid, name, _, current = user

        if current == target_role:
            print(f"ℹ️  {name} ({email}) is already '{target_role}'")
            return

        if current == "admin" and target_role != "admin":
            print("⚠️  Demoting an admin. Are you sure?")
            confirm = input("Type YES to continue: ").strip().upper()
            if confirm != "YES":
                print("Cancelled.")
                return

        await conn.execute(
            text("UPDATE users SET role = :r WHERE id = :id"),
            {"r": target_role, "id": uid}
        )

        print(f"✅ Updated: {name} ({email})  →  {current} → {target_role}")

        # Show current admins
        admins_res = await conn.execute(
            text("SELECT name, email FROM users WHERE role = 'admin' ORDER BY name")
        )
        admins = admins_res.fetchall()
        print("\nCurrent admins:")
        for n, e in admins:
            print(f"  • {n} <{e}>")

    await engine.dispose()

async def main():
    print("👑 Admin Role Manager")
    print("-" * 40)

    email = input("Email address: ").strip()
    if not email:
        print("No email given.")
        return

    action = input("Action (promote / demote): ").strip().lower()
    if action not in ("promote", "demote"):
        print("Invalid action. Use 'promote' or 'demote'.")
        return

    target = "admin" if action == "promote" else "user"

    await change_role(email, target)

if __name__ == "__main__":
    asyncio.run(main())
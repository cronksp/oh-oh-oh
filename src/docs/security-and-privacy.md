# Security & Privacy

## Authentication
- **Method**: Email/Password.
- **Storage**: Passwords are hashed using `bcrypt` (salt rounds: 12).
- **Sessions**: HTTP-only, secure cookies containing an encrypted JWT (JWE).

## Private Event Encryption
Private events are encrypted at rest in the database to ensure privacy even from DB admins.

### Strategy
1.  **System Master Key (SMK)**: Stored in environment variables (`SYSTEM_MASTER_KEY`).
2.  **User Data Key (UDK)**: A unique 32-byte key generated for each user upon registration.
3.  **Key Storage**: The UDK is encrypted with the SMK and stored in the `users` table (`encrypted_private_key`).
4.  **Data Encryption**:
    - When a user creates a private event, the system decrypts their UDK using the SMK.
    - The event title, description, and metadata are encrypted using the UDK (AES-256-GCM).
    - The encrypted blob is stored in the `encrypted_data` column.
    - Public fields (start/end time, type) remain unencrypted for filtering/availability checks.

### Trade-offs
- **Key Management**: If the `SYSTEM_MASTER_KEY` is lost, all private data is unrecoverable.
- **Performance**: Decryption happens on the application server for each private event fetched.
- **Search**: Private event content is not searchable in the DB.

## Data Minimization
- We only store necessary user info (Name, Email, Hash, Role).
- No external analytics or tracking.

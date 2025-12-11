# Data Model

## Users
| Column | Type | Description |
|Str|Str|Str|
| `id` | UUID | Primary Key |
| `email` | Text | Unique email |
| `password_hash` | Text | Bcrypt hash |
| `name` | Text | Display name |
| `role` | Enum | `user` or `admin` |
| `encrypted_private_key` | Text | User's data key encrypted with System Master Key |

## Events
| Column | Type | Description |
|Str|Str|Str|
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK to Users |
| `title` | Text | Event title (masked if private) |
| `description` | Text | Event description (masked if private) |
| `start_time` | Timestamp | Start of event |
| `end_time` | Timestamp | End of event |
| `is_private` | Boolean | Visibility flag |
| `event_type` | Enum | Type (vacation, meeting, etc.) |
| `encrypted_data` | Text | Encrypted JSON blob (title, desc) if private |

## Groupings
| Column | Type | Description |
|Str|Str|Str|
| `id` | UUID | Primary Key |
| `name` | Text | Group name |
| `color` | Text | Display color |

## EventGroupings
Many-to-Many relationship between Events and Groupings.

"""drop subscription alerts flag

Revision ID: 939d86c17ac0
Revises: b7c4e0a51d92
Create Date: 2026-10-23 01:16:44.148714

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '939d86c17ac0'
down_revision: Union[str, Sequence[str], None] = 'b7c4e0a51d92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Plain ALTER, not batch: recreating subscriptions drops the parent of the alerts
    # foreign key, and with PRAGMA foreign_keys=ON that cascade empties alerts.
    op.drop_column('subscriptions', 'alerts_enabled')


def downgrade() -> None:
    """Downgrade schema."""
    # server_default: the column is NOT NULL and existing rows need a value on the way back.
    op.add_column('subscriptions', sa.Column('alerts_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))

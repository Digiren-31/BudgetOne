package com.budgetone.app.ui.screens.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Settings",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // User Profile Section
            item {
                ProfileCard()
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
            }

            // SMS Onboarding
            item {
                SettingsSection(title = "Smart Features")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Message,
                    title = "SMS Onboarding",
                    subtitle = "Register bank SMS templates",
                    onClick = { /* Navigate to SMS onboarding */ }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Notifications,
                    title = "Smart Notifications",
                    subtitle = "Get alerts for transactions",
                    onClick = { /* Navigate to notification settings */ }
                )
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Appearance
            item {
                SettingsSection(title = "Appearance")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Palette,
                    title = "Theme",
                    subtitle = "Light, Dark, or System",
                    onClick = { /* Show theme picker */ }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.AttachMoney,
                    title = "Currency",
                    subtitle = "₹ INR",
                    onClick = { /* Show currency picker */ }
                )
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Data Management
            item {
                SettingsSection(title = "Data Management")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Category,
                    title = "Manage Categories",
                    subtitle = "Add, edit, or delete categories",
                    onClick = { /* Navigate to category management */ }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Backup,
                    title = "Backup & Restore",
                    subtitle = "Export or import your data",
                    onClick = { /* Show backup options */ }
                )
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
            }

            // About
            item {
                SettingsSection(title = "About")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Info,
                    title = "About BudgetOne",
                    subtitle = "Version 1.0.0",
                    onClick = { /* Show about dialog */ }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.PrivacyTip,
                    title = "Privacy Policy",
                    subtitle = "View our privacy policy",
                    onClick = { /* Open privacy policy */ }
                )
            }
        }
    }
}

@Composable
fun ProfileCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Profile Picture Placeholder
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .clickable { /* Edit profile */ },
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    modifier = Modifier.size(64.dp),
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primary
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Profile",
                            modifier = Modifier.size(32.dp),
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column {
                Text(
                    "User Name",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Tap to edit profile",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            IconButton(onClick = { /* Edit profile */ }) {
                Icon(
                    Icons.Default.Edit,
                    contentDescription = "Edit Profile",
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

@Composable
fun SettingsSection(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.titleSmall,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, top = 8.dp, bottom = 4.dp)
    )
}

@Composable
fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                contentDescription = title,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Icon(
                Icons.Default.ChevronRight,
                contentDescription = "Navigate",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
